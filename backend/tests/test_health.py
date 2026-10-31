# Backend tests
import pytest
from httpx import AsyncClient
from app.main import create_app
from app.core.database import init_db

app = create_app()


@pytest.fixture(scope="session", autouse=True)
async def initialize_db():
    await init_db()


@pytest.fixture
async def client():
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["app"] == "prism-foundry"
    assert "version" in data


@pytest.mark.asyncio
async def test_db_health_check(client):
    resp = await client.get("/health/db")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("healthy", "unhealthy")
    assert "database" in data