from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime
from app.core.database import get_session
from app.models import MarketData
from app.services.market_data_ingestion import fetch_and_store_ohlcv, fetch_latest_price
from pydantic import BaseModel, Field, ConfigDict


router = APIRouter()


class MarketDataResponse(BaseModel):
    id: int
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    source: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MarketDataListResponse(BaseModel):
    items: list[MarketDataResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class MarketDataCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=32)
    timestamp: datetime
    open: float = Field(..., gt=0)
    high: float = Field(..., gt=0)
    low: float = Field(..., gt=0)
    close: float = Field(..., gt=0)
    volume: float = Field(..., ge=0)
    source: str = Field(default="manual", max_length=64)


@router.get("", response_model=MarketDataListResponse)
async def list_market_data(
    symbol: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    query = select(MarketData)
    count_query = select(func.count(MarketData.id))

    if symbol:
        query = query.where(MarketData.symbol == symbol.upper())
        count_query = count_query.where(MarketData.symbol == symbol.upper())
    if start_date:
        query = query.where(MarketData.timestamp >= start_date)
        count_query = count_query.where(MarketData.timestamp >= start_date)
    if end_date:
        query = query.where(MarketData.timestamp <= end_date)
        count_query = count_query.where(MarketData.timestamp <= end_date)

    query = query.order_by(desc(MarketData.timestamp))
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(query)
    items = result.scalars().all()

    return MarketDataListResponse(
        items=[MarketDataResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.get("/symbols", response_model=list[str])
async def list_symbols(session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(MarketData.symbol).distinct())
    return [row[0] for row in result.all()]


@router.post("", response_model=MarketDataResponse, status_code=201)
async def create_market_data(data: MarketDataCreate, session: AsyncSession = Depends(get_session)):
    md = MarketData(**data.model_dump())
    session.add(md)
    await session.flush()
    await session.refresh(md)
    return MarketDataResponse.model_validate(md)


@router.get("/{data_id}", response_model=MarketDataResponse)
async def get_market_data(data_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(MarketData).where(MarketData.id == data_id))
    md = result.scalar_one_or_none()
    if not md:
        raise HTTPException(status_code=404, detail="Market data not found")
    return MarketDataResponse.model_validate(md)
class IngestRequest(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=32)
    period: str = Field(default="1mo", pattern="^(1d|5d|1mo|3mo|6mo|1y|2y|5y|10y|ytd|max)$")
    interval: str = Field(default="1d", pattern="^(1m|2m|5m|15m|30m|60m|90m|1h|1d|5d|1wk|1mo|3mo)$")
    source: str = Field(default="yfinance", max_length=64)


class IngestResponse(BaseModel):
    symbol: str
    period: str
    interval: str
    records_created: int
    records: list[MarketDataResponse]


@router.post("/ingest", response_model=IngestResponse)
async def ingest_market_data(data: IngestRequest, session: AsyncSession = Depends(get_session)):
    """Fetch OHLCV data from external source and store in database."""
    records = await fetch_and_store_ohlcv(
        session=session,
        symbol=data.symbol,
        period=data.period,
        interval=data.interval,
        source=data.source,
    )
    return IngestResponse(
        symbol=data.symbol.upper(),
        period=data.period,
        interval=data.interval,
        records_created=len(records),
        records=[MarketDataResponse.model_validate(r) for r in records],
    )


@router.post("/ingest/latest", response_model=MarketDataResponse)
async def ingest_latest_price(symbol: str = Query(..., min_length=1, max_length=32), source: str = Query(default="yfinance", max_length=64), session: AsyncSession = Depends(get_session)):
    """Fetch and store the latest price for a symbol."""
    record = await fetch_latest_price(session=session, symbol=symbol, source=source)
    if not record:
        raise HTTPException(status_code=404, detail=f"No data found for symbol {symbol}")
    return MarketDataResponse.model_validate(record)
