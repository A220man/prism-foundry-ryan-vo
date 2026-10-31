# Changelog

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
