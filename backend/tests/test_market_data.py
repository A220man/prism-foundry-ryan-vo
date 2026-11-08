from urllib.parse import quote
import pytest
from httpx import AsyncClient
from datetime import datetime, timezone
from app.main import create_app
from app.core.database import init_db, reset_db

app = create_app()


@pytest.fixture(scope="function", autouse=True)
async def initialize_db():
    await reset_db()


@pytest.fixture
async def client():
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
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


@pytest.mark.asyncio
async def test_list_market_data_filter_symbol(client):
    """Test filtering market data by symbol."""
    # Use unique symbols to avoid conflicts with other tests
    symbol1 = "TESTBTC"
    symbol2 = "TESTETH"
    base_time = datetime.now(timezone.utc)
    
    # Create test data for two different symbols
    for i, symbol in enumerate([symbol1, symbol2]):
        payload = {
            "symbol": symbol,
            "timestamp": base_time.isoformat(),
            "open": 50000.0 + i * 1000,
            "high": 51000.0 + i * 1000,
            "low": 49500.0 + i * 1000,
            "close": 50500.0 + i * 1000,
            "volume": 100.5 + i * 10,
            "source": "test",
        }
        await client.post("/api/v1/market-data", json=payload)
    
    # Filter by symbol1
    resp = await client.get(f"/api/v1/market-data?symbol={symbol1}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["symbol"] == symbol1
    
    # Filter by symbol2
    resp = await client.get(f"/api/v1/market-data?symbol={symbol2}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["symbol"] == symbol2


@pytest.mark.asyncio
async def test_list_market_data_pagination(client):
    """Test pagination of market data."""
    # Use unique symbol to avoid conflicts with other tests
    symbol = "TESTPAGE"
    base_time = datetime.now(timezone.utc)
    
    # Get initial count
    resp = await client.get(f"/api/v1/market-data?symbol={symbol}")
    initial_total = resp.json()["total"]
    
    # Create 5 test records with slightly different timestamps
    for i in range(5):
        payload = {
            "symbol": symbol,
            "timestamp": (base_time.replace(second=i)).isoformat(),
            "open": 50000.0 + i,
            "high": 51000.0 + i,
            "low": 49500.0 + i,
            "close": 50500.0 + i,
            "volume": 100.5 + i,
            "source": "test",
        }
        await client.post("/api/v1/market-data", json=payload)
    
    # Verify total increased by 5
    resp = await client.get(f"/api/v1/market-data?symbol={symbol}")
    assert resp.json()["total"] == initial_total + 5
    
    # Page 1 with page_size=2
    resp = await client.get(f"/api/v1/market-data?symbol={symbol}&page=1&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert len(data["items"]) == 2
    
    # Page 2
    resp = await client.get(f"/api/v1/market-data?symbol={symbol}&page=2&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 2
    assert len(data["items"]) == 2
    
    # Page 3 (last page with 1 item)
    resp = await client.get(f"/api/v1/market-data?symbol={symbol}&page=3&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["page"] == 3
    assert len(data["items"]) == 1


@pytest.mark.asyncio
async def test_list_market_data_date_filter(client):
    """Test filtering market data by date range."""
    # Use unique symbol
    symbol = "TESTDATE"
    base_time = datetime.now(timezone.utc)
    
    # Create timestamps with clear separation
    early_time = base_time.replace(hour=0, minute=0, second=0, microsecond=0)
    late_time = base_time.replace(hour=12, minute=0, second=0, microsecond=0)
    
    # Create early record
    payload1 = {
        "symbol": symbol,
        "timestamp": early_time.isoformat(),
        "open": 50000.0,
        "high": 51000.0,
        "low": 49500.0,
        "close": 50500.0,
        "volume": 100.5,
        "source": "test",
    }
    # Create late record
    payload2 = {
        "symbol": symbol,
        "timestamp": late_time.isoformat(),
        "open": 51000.0,
        "high": 52000.0,
        "low": 50500.0,
        "close": 51500.0,
        "volume": 200.5,
        "source": "test",
    }
    await client.post("/api/v1/market-data", json=payload1)
    await client.post("/api/v1/market-data", json=payload2)
    # Filter by start_date (should get late record only)
    # URL-encode the datetime to preserve + in timezone
    resp = await client.get(f"/api/v1/market-data?symbol={symbol}&start_date={quote(late_time.isoformat())}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["open"] == 51000.0
    
    # Filter by end_date (should get early record only)
    resp = await client.get(f"/api/v1/market-data?symbol={symbol}&end_date={quote(early_time.isoformat())}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["items"][0]["open"] == 50000.0