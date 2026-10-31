from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime
from app.core.database import get_session
from app.models import MarketData
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
