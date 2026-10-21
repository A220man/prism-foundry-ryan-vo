# Backend tests
import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from app.main import create_app
from app.core.database import init_db

app = create_app()


@pytest.fixture(scope="session", autouse=True)
async def initialize_db():
    await init_db()


@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_create_market_data(client):
    payload = {
        "symbol": "BTCUSDT",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "open": 50000.0,
        "high": 51000.0,
        "low": 49500.0,
        "close": 50500.0,
        "volume": 100.5,
        "source": "test",
    }
    resp = await client.post("/api/v1/market-data", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["symbol"] == "BTCUSDT"
    assert data["open"] == 50000.0
    assert "id" in data


@pytest.mark.asyncio
async def test_list_market_data(client):
    resp = await client.get("/api/v1/market-data")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data


@pytest.mark.asyncio
async def test_list_symbols(client):
    resp = await client.get("/api/v1/market-data/symbols")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_market_data_not_found(client):
    resp = await client.get("/api/v1/market-data/999999")
    assert resp.status_code == 404