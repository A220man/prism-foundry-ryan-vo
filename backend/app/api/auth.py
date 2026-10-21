from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import OAuth2AuthorizationCodeBearer
from pydantic import BaseModel
from typing import Optional
import secrets
import httpx
from app.core.config import settings

router = APIRouter()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None


class UserInfo(BaseModel):
    sub: str
    email: Optional[str] = None
    name: Optional[str] = None
    preferred_username: Optional[str] = None
    realm_access: Optional[dict] = None


@router.get("/login")
async def oidc_login(request: Request):
    if not settings.OIDC_ISSUER_URL or not settings.OIDC_CLIENT_ID:
        raise HTTPException(status_code=503, detail="OIDC not configured")

    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)

    request.session["oidc_state"] = state
    request.session["oidc_nonce"] = nonce

    auth_url = f"{settings.OIDC_ISSUER_URL}/protocol/openid-connect/auth"
    params = {
        "client_id": settings.OIDC_CLIENT_ID,
        "response_type": "code",
        "scope": settings.OIDC_SCOPES,
        "redirect_uri": settings.OIDC_REDIRECT_URI,
        "state": state,
        "nonce": nonce,
    }

    query = "&".join(f"{k}={v}" for k, v in params.items())
    return {"auth_url": f"{auth_url}?{query}", "state": state}


@router.get("/callback")
async def oidc_callback(request: Request, code: str, state: str):
    if not settings.OIDC_ISSUER_URL or not settings.OIDC_CLIENT_ID:
        raise HTTPException(status_code=503, detail="OIDC not configured")

    stored_state = request.session.get("oidc_state")
    if not stored_state or stored_state != state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    token_url = f"{settings.OIDC_ISSUER_URL}/protocol/openid-connect/token"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.OIDC_REDIRECT_URI,
        "client_id": settings.OIDC_CLIENT_ID,
        "client_secret": settings.OIDC_CLIENT_SECRET,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(token_url, data=data)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Token exchange failed")
        tokens = resp.json()

    return tokens


@router.post("/logout")
async def oidc_logout(request: Request, response: Response):
    request.session.clear()
    response.delete_cookie("session")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserInfo)
async def get_current_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user