from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from pydantic import BaseModel, Field, ConfigDict
from app.core.database import get_session
from app.services.tokenizer_service import TokenizerService

router = APIRouter()

class TokenizeRequest(BaseModel):
    prices: List[float] = Field(..., min_items=1, description="Sequence of price values (e.g., open, high, low, close)")
    scale: int = Field(default=1000, description="Multiplier for quantizing floats to integers (default 1000)")

class TokenizeResponse(BaseModel):
    tokens: List[int]
    scale: int
    deterministic: bool = True

@router.post("/tokenize", response_model=TokenizeResponse)
async def tokenize_price_sequence(data: TokenizeRequest, session: AsyncSession = Depends(get_session)):
    """Deterministic tokenization of price sequences.

    Takes a sequence of price values (e.g., open, high, low, close) and returns integer tokens.
    This service works offline and does not require any external API keys.
    """
    tokenizer = TokenizerService()
    tokens = tokenizer.tokenize(data.prices, data.scale)
    return TokenizeResponse(tokens=tokens, scale=data.scale)