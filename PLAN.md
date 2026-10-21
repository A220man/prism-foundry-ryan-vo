# Product development plan

Each round completes one feature or repair. Future items are planned, not implemented claims.

## Current round

core-skeleton

## Roadmap

### core-skeleton — Core FastAPI/React skeleton with health check

Status: done

Acceptance:
- FastAPI backend starts and responds to /health
- React frontend builds and loads
- Docker compose brings up backend + frontend
- Basic project structure matches owned-app contract

Implementation: `backend/app/main.py`, `backend/app/api/health.py`, `backend/app/api/market_data.py`, `backend/app/api/predictions.py`, `backend/app/api/finetune.py`, `backend/app/api/auth.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/models/__init__.py`, `backend/requirements.txt`, `backend/pyproject.toml`, `backend/Dockerfile`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/MarketData.tsx`, `frontend/src/pages/Predictions.tsx`, `frontend/src/pages/FineTune.tsx`, `frontend/src/pages/Evaluation.tsx`, `frontend/src/api/client.ts`, `frontend/src/components/Layout.tsx`, `frontend/src/components/Navbar.tsx`, `frontend/src/components/LoadingSpinner.tsx`, `frontend/src/components/Toast.tsx`, `frontend/src/hooks/useAppStore.ts`, `frontend/src/index.css`, `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/Dockerfile`, `compose.yaml`, `.github/workflows/ci.yml`, `pyproject.toml`

Tests: `backend/tests/test_health.py`, `backend/tests/test_market_data.py`, `backend/tests/test_predictions.py`, `backend/tests/test_finetune.py`, `backend/tests/test_auth.py`, `frontend/src/pages/Dashboard.test.tsx`, `frontend/src/pages/MarketData.test.tsx`, `frontend/src/pages/Predictions.test.tsx`

### market-data-ingestion — Market data ingestion and storage

Status: planned

Acceptance:
- API to fetch/store OHLCV data from configurable sources
- SQLite persistence with parameterized queries
- Pagination and filtering on historical data endpoints

### tokenizer-service — Kronos tokenizer service (offline core)

Status: planned

Acceptance:
- Deterministic tokenization of price sequences
- Works without LLM API keys
- Unit tests for boundary cases

### prediction-engine — Prediction engine with evaluation metrics

Status: planned

Acceptance:
- Generate predictions from historical context
- Compute MAE, RMSE, MAPE, Correlation
- Evaluation workflow with reproducible results

### finetune-workflow — Fine-tuning workflow for custom symbols

Status: planned

Acceptance:
- Configure fine-tuning runs with custom data
- Track training progress and metrics
- Export adapted model artifacts

### oidc-auth — OIDC authentication with Keycloak

Status: planned

Acceptance:
- Authorization code flow with PKCE
- Backend session cookies + CSRF protection
- Role-based access (viewer/operator/admin)

### llm-adapters — LLM provider adapters (OpenAI/Anthropic/Gemini/Ollama)

Status: planned

Acceptance:
- Configurable provider/model/endpoint
- Bounded timeouts, redacted errors
- Keys only server-side

