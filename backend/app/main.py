from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.core.database import lifespan
from app.api import health, market_data, predictions, finetune, auth
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Prism Foundry - Kronos API",
        description="Foundation Model for the Language of Financial Markets",
        version=settings.APP_VERSION,
        lifespan=lifespan,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    )

    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.OIDC_CLIENT_SECRET or "dev-secret-change-in-production",
        same_site="lax",
        https_only=settings.ENVIRONMENT == "production",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(f"{request.method} {request.url.path}")
        response = await call_next(request)
        return response

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    app.include_router(health.router, tags=["health"])
    app.include_router(market_data.router, prefix="/api/v1/market-data", tags=["market-data"])
    app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["predictions"])
    app.include_router(finetune.router, prefix="/api/v1/finetune", tags=["finetune"])
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

    return app


app = create_app()