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
    from httpx import ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_create_prediction(client):
    payload = {
        "symbol": "BTCUSDT",
        "context_start": datetime.now(timezone.utc).isoformat(),
        "context_end": datetime.now(timezone.utc).isoformat(),
        "prediction_start": datetime.now(timezone.utc).isoformat(),
        "prediction_end": datetime.now(timezone.utc).isoformat(),
        "predicted_values": [50100.0, 50200.0, 50300.0],
        "actual_values": [50050.0, 50150.0, 50250.0],
        "model_version": "kronos-v1",
    }
    resp = await client.post("/api/v1/predictions", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["symbol"] == "BTCUSDT"
    assert len(data["predicted_values"]) == 3
    assert data["mae"] is not None
    assert data["rmse"] is not None
    assert data["mape"] is not None
    assert data["correlation"] is not None


@pytest.mark.asyncio
async def test_create_prediction_without_actual(client):
    payload = {
        "symbol": "ETHUSDT",
        "context_start": datetime.now(timezone.utc).isoformat(),
        "context_end": datetime.now(timezone.utc).isoformat(),
        "prediction_start": datetime.now(timezone.utc).isoformat(),
        "prediction_end": datetime.now(timezone.utc).isoformat(),
        "predicted_values": [3000.0, 3010.0, 3020.0],
        "model_version": "kronos-v1",
    }
    resp = await client.post("/api/v1/predictions", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["actual_values"] is None
    assert data["mae"] is None


@pytest.mark.asyncio
async def test_list_predictions(client):
    resp = await client.get("/api/v1/predictions")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_evaluate_prediction_endpoint(client):
    resp = await client.post(
        "/api/v1/predictions/evaluate",
        json={"predicted": [100.0, 101.0, 102.0], "actual": [100.5, 101.5, 102.5]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "mae" in data
    assert "rmse" in data
    assert "mape" in data
    assert "correlation" in data


@pytest.mark.asyncio
async def test_evaluate_prediction_mismatched_lengths(client):
    resp = await client.post(
        "/api/v1/predictions/evaluate",
        json={"predicted": [100.0, 101.0], "actual": [100.5]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["mae"] is None