"""Tests for market data ingestion endpoints."""
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone
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
async def test_ingest_market_data_mock(client):
    """Test ingest endpoint with mocked yfinance."""
    import pandas as pd
    from datetime import datetime, timezone
    
    # Create a proper pandas DataFrame mock
    timestamps = pd.DatetimeIndex([datetime.now(timezone.utc)])
    mock_hist = MagicMock()
    mock_hist.empty = False
    mock_hist.index = timestamps
    mock_hist.tz = None
    mock_hist.iterrows.return_value = [
        (timestamps[0], {"Open": 50000.0, "High": 51000.0, "Low": 49500.0, "Close": 50500.0, "Volume": 100.5})
    ]
    mock_hist.__len__.return_value = 1

    with patch("yfinance.Ticker") as mock_ticker:
        mock_ticker.return_value.history.return_value = mock_hist
        resp = await client.post("/api/v1/market-data/ingest", json={
            "symbol": "BTC-USD",
            "period": "1mo",
            "interval": "1d",
            "source": "yfinance"
        })
    
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "BTC-USD"
    assert data["records_created"] >= 0
    assert "records" in data


@pytest.mark.asyncio
async def test_ingest_market_data_empty(client):
    """Test ingest endpoint when yfinance returns empty data."""
    mock_hist = MagicMock()
    mock_hist.empty = True

    with patch("yfinance.Ticker") as mock_ticker:
        mock_ticker.return_value.history.return_value = mock_hist
        resp = await client.post("/api/v1/market-data/ingest", json={
            "symbol": "INVALID",
            "period": "1mo",
            "interval": "1d",
            "source": "yfinance"
        })
    
    assert resp.status_code == 200
    data = resp.json()
    assert data["records_created"] == 0
    assert data["records"] == []


@pytest.mark.asyncio
async def test_ingest_latest_price_mock(client):
    """Test ingest latest price endpoint with mocked yfinance."""
    import pandas as pd
    from datetime import datetime, timezone
    
    # Create a proper pandas DataFrame mock
    timestamps = pd.DatetimeIndex([datetime.now(timezone.utc)])
    mock_hist = MagicMock()
    mock_hist.empty = False
    mock_hist.index = timestamps
    mock_hist.iloc = [MagicMock()]
    mock_hist.iloc[-1] = {"Open": 50000.0, "High": 51000.0, "Low": 49500.0, "Close": 50500.0, "Volume": 100.5}
    mock_hist.__len__.return_value = 1

    with patch("yfinance.Ticker") as mock_ticker:
        mock_ticker.return_value.history.return_value = mock_hist
        resp = await client.post("/api/v1/market-data/ingest/latest", params={
            "symbol": "BTC-USD",
            "source": "yfinance"
        })
    
    assert resp.status_code == 200
    data = resp.json()
    assert data["symbol"] == "BTC-USD"
    assert "id" in data


@pytest.mark.asyncio
async def test_ingest_latest_price_not_found(client):
    """Test ingest latest price when no data found."""
    mock_hist = MagicMock()
    mock_hist.empty = True

    with patch("yfinance.Ticker") as mock_ticker:
        mock_ticker.return_value.history.return_value = mock_hist
        resp = await client.post("/api/v1/market-data/ingest/latest", params={
            "symbol": "INVALID",
            "source": "yfinance"
        })
    
    assert resp.status_code == 404
