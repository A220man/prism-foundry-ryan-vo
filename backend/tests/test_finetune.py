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
async def test_create_finetune_run(client):
    payload = {
        "name": "btc-finetune-1",
        "symbol": "BTCUSDT",
        "base_model": "kronos-base",
        "epochs": 10,
        "learning_rate": 0.0001,
        "config": {"batch_size": 32, "seq_len": 120},
    }
    resp = await client.post("/api/v1/finetune", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "btc-finetune-1"
    assert data["symbol"] == "BTCUSDT"
    assert data["status"] == "pending"
    assert data["config"]["batch_size"] == 32


@pytest.mark.asyncio
async def test_list_finetune_runs(client):
    resp = await client.get("/api/v1/finetune")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_finetune_run_not_found(client):
    resp = await client.get("/api/v1/finetune/999999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_finetune_run(client):
    # Create first
    payload = {
        "name": "update-test",
        "symbol": "ETHUSDT",
        "base_model": "kronos-base",
        "epochs": 5,
        "learning_rate": 0.001,
    }
    create_resp = await client.post("/api/v1/finetune", json=payload)
    assert create_resp.status_code == 201
    run_id = create_resp.json()["id"]

    # Update
    update_payload = {"status": "running", "train_loss": 0.5}
    resp = await client.patch(f"/api/v1/finetune/{run_id}", json=update_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "running"
    assert data["train_loss"] == 0.5