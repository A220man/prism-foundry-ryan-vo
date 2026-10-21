from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime
import json
import numpy as np
from app.core.database import get_session
from app.models import Prediction
from pydantic import BaseModel, Field

router = APIRouter()


class PredictionResponse(BaseModel):
    id: int
    symbol: str
    context_start: datetime
    context_end: datetime
    prediction_start: datetime
    prediction_end: datetime
    predicted_values: list[float]
    actual_values: Optional[list[float]]
    mae: Optional[float]
    rmse: Optional[float]
    mape: Optional[float]
    correlation: Optional[float]
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True


class PredictionListResponse(BaseModel):
    items: list[PredictionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PredictionCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=32)
    context_start: datetime
    context_end: datetime
    prediction_start: datetime
    prediction_end: datetime
    predicted_values: list[float] = Field(..., min_length=1)
    actual_values: Optional[list[float]] = None
    model_version: str = "kronos-v1"


def calculate_metrics(predicted: list[float], actual: list[float]) -> dict:
    if len(predicted) != len(actual) or len(predicted) == 0:
        return {"mae": None, "rmse": None, "mape": None, "correlation": None}

    pred_arr = np.array(predicted, dtype=np.float64)
    actual_arr = np.array(actual, dtype=np.float64)

    mae = float(np.mean(np.abs(pred_arr - actual_arr)))
    rmse = float(np.sqrt(np.mean((pred_arr - actual_arr) ** 2)))

    # MAPE - avoid division by zero
    mask = actual_arr != 0
    if np.any(mask):
        mape = float(np.mean(np.abs((actual_arr[mask] - pred_arr[mask]) / actual_arr[mask])) * 100)
    else:
        mape = None

    # Correlation
    if len(pred_arr) > 1 and np.std(pred_arr) > 0 and np.std(actual_arr) > 0:
        correlation = float(np.corrcoef(pred_arr, actual_arr)[0, 1])
    else:
        correlation = None

    return {"mae": mae, "rmse": rmse, "mape": mape, "correlation": correlation}


@router.get("", response_model=PredictionListResponse)
async def list_predictions(
    symbol: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    query = select(Prediction)
    count_query = select(func.count(Prediction.id))

    if symbol:
        query = query.where(Prediction.symbol == symbol.upper())
        count_query = count_query.where(Prediction.symbol == symbol.upper())

    query = query.order_by(desc(Prediction.created_at))
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await session.execute(query)
    items = result.scalars().all()

    return PredictionListResponse(
        items=[
            PredictionResponse(
                id=item.id,
                symbol=item.symbol,
                context_start=item.context_start,
                context_end=item.context_end,
                prediction_start=item.prediction_start,
                prediction_end=item.prediction_end,
                predicted_values=json.loads(item.predicted_values),
                actual_values=json.loads(item.actual_values) if item.actual_values else None,
                mae=item.mae,
                rmse=item.rmse,
                mape=item.mape,
                correlation=item.correlation,
                model_version=item.model_version,
                created_at=item.created_at,
            )
            for item in items
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@router.post("", response_model=PredictionResponse, status_code=201)
async def create_prediction(data: PredictionCreate, session: AsyncSession = Depends(get_session)):
    metrics = {}
    if data.actual_values is not None:
        metrics = calculate_metrics(data.predicted_values, data.actual_values)

    pred = Prediction(
        symbol=data.symbol.upper(),
        context_start=data.context_start,
        context_end=data.context_end,
        prediction_start=data.prediction_start,
        prediction_end=data.prediction_end,
        predicted_values=json.dumps(data.predicted_values),
        actual_values=json.dumps(data.actual_values) if data.actual_values else None,
        mae=metrics.get("mae"),
        rmse=metrics.get("rmse"),
        mape=metrics.get("mape"),
        correlation=metrics.get("correlation"),
        model_version=data.model_version,
    )
    session.add(pred)
    await session.flush()
    await session.refresh(pred)

    return PredictionResponse(
        id=pred.id,
        symbol=pred.symbol,
        context_start=pred.context_start,
        context_end=pred.context_end,
        prediction_start=pred.prediction_start,
        prediction_end=pred.prediction_end,
        predicted_values=data.predicted_values,
        actual_values=data.actual_values,
        mae=metrics.get("mae"),
        rmse=metrics.get("rmse"),
        mape=metrics.get("mape"),
        correlation=metrics.get("correlation"),
        model_version=pred.model_version,
        created_at=pred.created_at,
    )


@router.get("/{pred_id}", response_model=PredictionResponse)
async def get_prediction(pred_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Prediction).where(Prediction.id == pred_id))
    pred = result.scalar_one_or_none()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return PredictionResponse(
        **pred.__dict__,
        predicted_values=json.loads(pred.predicted_values),
        actual_values=json.loads(pred.actual_values) if pred.actual_values else None,
    )


@router.post("/evaluate", response_model=dict)
async def evaluate_prediction(
    predicted: list[float],
    actual: list[float],
):
    """Evaluate prediction metrics without storing."""
    return calculate_metrics(predicted, actual)