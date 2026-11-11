# Changelog

## 1.5.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.4.0 — 2026-11-11

### Added
- Market data ingestion service with yfinance integration (`backend/app/services/market_data_ingestion.py`)
- Ingest OHLCV data via POST `/api/v1/market-data/ingest` with configurable period/interval/source
- Ingest latest price via POST `/api/v1/market-data/ingest/latest`
- SQLite persistence with deduplication (upsert by symbol+timestamp)
- Tests for ingestion endpoints with mocked yfinance (`backend/tests/test_market_data_ingestion.py`)

### Fixed
- Created `backend/data` directory for SQLite database file
- All 24 backend tests pass (health, market_data, market_data_ingestion, predictions, finetune, auth)
- All 9 frontend tests pass (Dashboard, MarketData, Predictions)
- Backend health endpoint verified: `/health` returns healthy status

## 1.4.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.3.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.2.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.1.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

### Fixed (2026-10-31)
- Fixed Pydantic class-based `config` deprecation warnings in `market_data.py`, `predictions.py`, `finetune.py` (migrated to `model_config = ConfigDict(from_attributes=True)`)
- Fixed duplicate `@router.patch("/{run_id}")` route in `finetune.py`
- Fixed test client fixtures to use `ASGITransport` for httpx compatibility (was using deprecated `app=` parameter)
- Created `backend/data` directory for SQLite database persistence
- All 17 backend tests pass (health, market_data, predictions, finetune, auth)
- All 9 frontend tests pass (Dashboard, MarketData, Predictions)
- Verified backend health endpoints: `/health` and `/health/db`

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## [1.0.0] - 2026-10-26

### Added
- FastAPI backend with modular structure (api, services, models, core)
- React + TypeScript + Vite frontend with dashboard, market data, predictions, fine-tuning, evaluation pages
- SQLite persistence with SQLAlchemy models for MarketData, Predictions, FineTuneRun, AuditLog
- Market data API with CRUD, pagination, symbol filtering
- Prediction engine with MAE, RMSE, MAPE, Correlation metrics
- Fine-tuning workflow API with status tracking
- OIDC authentication endpoints (Keycloak integration ready)
- Docker Compose with backend, frontend, Keycloak, Redis
- Comprehensive test suite (backend: health, market data, predictions, fine-tune, auth; frontend: dashboard, market data, predictions)
- Portfolio manifest and documentation

### Fixed
- Added missing `itsdangerous` dependency for session middleware
- Created database data directory for SQLite persistence
- Fixed TypeScript build errors in frontend test files (vi.hoisted mocks, unused imports)
- Fixed vitest mock hoisting issues in all frontend test files

### Architecture
- Backend: FastAPI, SQLAlchemy 2.0, Pydantic 2, pytest/httpx
- Frontend: React 18, TypeScript, Vite, Vitest, React Router, Zustand, Recharts
- Auth: Keycloak OIDC with PKCE, HttpOnly cookies, CSRF protection
- Database: SQLite (dev), PostgreSQL-ready
- Caching: Redis

### Security
- Authorization code flow with PKCE and nonce
- HttpOnly SameSite cookies
- CSRF protection on mutating endpoints
- Role-based access control (viewer/operator/admin)
- Demo mode restricted to localhost
- No credentials in logs or client storage
