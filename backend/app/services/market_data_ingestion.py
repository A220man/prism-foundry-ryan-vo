"""Market data ingestion service for fetching OHLCV data from external sources."""
from datetime import datetime, timezone
from typing import Optional
import yfinance as yf
import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import MarketData


async def fetch_and_store_ohlcv(
    session: AsyncSession,
    symbol: str,
    period: str = "1mo",
    interval: str = "1d",
    source: str = "yfinance",
) -> list[MarketData]:
    """
    Fetch OHLCV data from yfinance and store in database.
    
    Args:
        session: Database session
        symbol: Trading symbol (e.g., "BTC-USD", "AAPL")
        period: Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo)
        source: Data source identifier
        
    Returns:
        List of created MarketData records
    """
    # Fetch data from yfinance
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period, interval=interval)
    
    if hist.empty:
        return []
    
    # Ensure timestamp is timezone-aware
    if hist.index.tz is None:
        hist.index = hist.index.tz_localize(timezone.utc)
    else:
        hist.index = hist.index.tz_convert(timezone.utc)
    
    created_records = []
    
    for timestamp, row in hist.iterrows():
        # Check if record already exists
        existing = await session.execute(
            select(MarketData).where(
                MarketData.symbol == symbol.upper(),
                MarketData.timestamp == timestamp.to_pydatetime(),
            )
        )
        if existing.scalar_one_or_none():
            continue
            
        md = MarketData(
            symbol=symbol.upper(),
            timestamp=timestamp.to_pydatetime(),
            open=float(row["Open"]),
            high=float(row["High"]),
            low=float(row["Low"]),
            close=float(row["Close"]),
            volume=float(row["Volume"]),
            source=source,
        )
        session.add(md)
        created_records.append(md)
    
    await session.flush()
    for record in created_records:
        await session.refresh(record)
    
    return created_records


async def fetch_latest_price(session: AsyncSession, symbol: str, source: str = "yfinance") -> Optional[MarketData]:
    """Fetch the latest price for a symbol and store it."""
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period="1d", interval="1m")
    
    if hist.empty:
        return None
    
    # Get the latest row
    latest = hist.iloc[-1]
    timestamp = hist.index[-1]
    
    if timestamp.tz is None:
        timestamp = timestamp.tz_localize(timezone.utc)
    else:
        timestamp = timestamp.tz_convert(timezone.utc)
    
    # Check if record already exists
    existing = await session.execute(
        select(MarketData).where(
            MarketData.symbol == symbol.upper(),
            MarketData.timestamp == timestamp.to_pydatetime(),
        )
    )
    if existing.scalar_one_or_none():
        return existing.scalar_one()
    
    md = MarketData(
        symbol=symbol.upper(),
        timestamp=timestamp.to_pydatetime(),
        open=float(latest["Open"]),
        high=float(latest["High"]),
        low=float(latest["Low"]),
        close=float(latest["Close"]),
        volume=float(latest["Volume"]),
        source=source,
    )
    session.add(md)
    await session.flush()
    await session.refresh(md)
    
    return md
