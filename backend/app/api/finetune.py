from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime
import json
from app.core.database import get_session
from app.models import FineTuneRun
from pydantic import BaseModel, Field, ConfigDict

router = APIRouter()


class FineTuneRunResponse(BaseModel):
    id: int
    name: str
    symbol: str
    base_model: str
    status: str
    epochs: int
    learning_rate: float
    train_loss: Optional[float]
    val_loss: Optional[float]
    config: dict
    artifacts_path: Optional[str]
    error_message: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FineTuneRunListResponse(BaseModel):
    items: list[FineTuneRunResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FineTuneRunCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    symbol: str = Field(..., min_length=1, max_length=32)
    base_model: str = Field(..., min_length=1, max_length=128)
    epochs: int = Field(default=10, ge=1, le=1000)
    learning_rate: float = Field(default=1e-4, gt=0, le=1)
    config: dict = Field(default_factory=dict)


class FineTuneRunUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|running|completed|failed)$")
    train_loss: Optional[float] = None
    val_loss: Optional[float] = None
    artifacts_path: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


@router.get("", response_model=FineTuneRunListResponse)
async def list_finetune_runs(
    symbol: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    query = select(FineTuneRun)
    count_query = select(func.count(FineTuneRun.id))

    if symbol:
        query = query.where(FineTuneRun.symbol == symbol.upper())
        count_query = count_query.where(FineTuneRun.symbol == symbol.upper())
    if status:
        query = query.where(FineTuneRun.status == status)
        count_query = count_query.where(FineTuneRun.status == status)

    query = query.order_by(desc(FineTuneRun.created_at))
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(query)
    items = result.scalars().all()

    return FineTuneRunListResponse(
        items=[
            FineTuneRunResponse(
                id=item.id,
                name=item.name,
                symbol=item.symbol,
                base_model=item.base_model,
                status=item.status,
                epochs=item.epochs,
                learning_rate=item.learning_rate,
                train_loss=item.train_loss,
                val_loss=item.val_loss,
                config=json.loads(item.config),
                artifacts_path=item.artifacts_path,
                error_message=item.error_message,
                started_at=item.started_at,
                completed_at=item.completed_at,
                created_at=item.created_at,
            )
            for item in items
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=FineTuneRunResponse, status_code=201)
async def create_finetune_run(data: FineTuneRunCreate, session: AsyncSession = Depends(get_session)):
    run = FineTuneRun(
        name=data.name,
        symbol=data.symbol.upper(),
        base_model=data.base_model,
        status="pending",
        epochs=data.epochs,
        learning_rate=data.learning_rate,
        config=json.dumps(data.config),
    )
    session.add(run)
    await session.flush()
    await session.refresh(run)
    return FineTuneRunResponse(
        id=run.id,
        name=run.name,
        symbol=run.symbol,
        base_model=run.base_model,
        status=run.status,
        epochs=run.epochs,
        learning_rate=run.learning_rate,
        train_loss=run.train_loss,
        val_loss=run.val_loss,
        config=data.config,
        artifacts_path=run.artifacts_path,
        error_message=run.error_message,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
    )


@router.get("/{run_id}", response_model=FineTuneRunResponse)
async def get_finetune_run(run_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(FineTuneRun).where(FineTuneRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Fine-tune run not found")
    return FineTuneRunResponse(
        id=run.id,
        name=run.name,
        symbol=run.symbol,
        base_model=run.base_model,
        status=run.status,
        epochs=run.epochs,
        learning_rate=run.learning_rate,
        train_loss=run.train_loss,
        val_loss=run.val_loss,
        config=json.loads(run.config),
        artifacts_path=run.artifacts_path,
        error_message=run.error_message,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
    )


@router.patch("/{run_id}", response_model=FineTuneRunResponse)
async def update_finetune_run(run_id: int, data: FineTuneRunUpdate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(FineTuneRun).where(FineTuneRun.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Fine-tune run not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(run, field, value)

    await session.flush()
    await session.refresh(run)
    return FineTuneRunResponse(
        id=run.id,
        name=run.name,
        symbol=run.symbol,
        base_model=run.base_model,
        status=run.status,
        epochs=run.epochs,
        learning_rate=run.learning_rate,
        train_loss=run.train_loss,
        val_loss=run.val_loss,
        config=json.loads(run.config),
        artifacts_path=run.artifacts_path,
        error_message=run.error_message,
        started_at=run.started_at,
        completed_at=run.completed_at,
        created_at=run.created_at,
    )
