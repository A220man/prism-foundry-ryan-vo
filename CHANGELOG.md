# Changelog

## 1.1.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

## 1.0.0 — work-in-progress checkpoint

Partial code published for continued development. Known issues: STATUS.md.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
