# Backend tests
import pytest
from httpx import AsyncClient
from app.main import create_app
from app.core.database import init_db
from app.core.config import settings

app = create_app()


@pytest.fixture(scope="session", autouse=True)
async def initialize_db():
    await init_db()


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.fixture(autouse=True)
def setup_oidc_config():
    # Set OIDC config for auth tests
    original_issuer = settings.OIDC_ISSUER_URL
    original_client = settings.OIDC_CLIENT_ID
    original_secret = settings.OIDC_CLIENT_SECRET
    original_redirect = settings.OIDC_REDIRECT_URI
    settings.OIDC_ISSUER_URL = "http://test-keycloak:8080/realms/prism"
    settings.OIDC_CLIENT_ID = "test-client"
    settings.OIDC_CLIENT_SECRET = "test-secret"
    settings.OIDC_REDIRECT_URI = "http://localhost:5173/callback"
    yield
    settings.OIDC_ISSUER_URL = original_issuer
    settings.OIDC_CLIENT_ID = original_client
    settings.OIDC_CLIENT_SECRET = original_secret
    settings.OIDC_REDIRECT_URI = original_redirect


@pytest.mark.asyncio
async def test_oidc_login_not_configured(client):
    # Temporarily unset config
    settings.OIDC_ISSUER_URL = None
    settings.OIDC_CLIENT_ID = None
    resp = await client.get("/api/v1/auth/login")
    assert resp.status_code == 503
    data = resp.json()
    assert "OIDC not configured" in data["detail"]


@pytest.mark.asyncio
async def test_oidc_callback_invalid_state(client):
    # First request to set up session with state
    async with AsyncClient(app=app, base_url="http://test") as ac:
        await ac.get("/api/v1/auth/login")
        # Now test invalid state
        resp = await ac.get("/api/v1/auth/callback?code=test&state=wrong")
        assert resp.status_code == 400
        data = resp.json()
        assert "Invalid state" in data["detail"]