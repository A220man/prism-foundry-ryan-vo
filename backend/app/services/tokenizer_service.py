"""Deterministic tokenizer for financial price sequences.

Provides functions to tokenize price sequences without external dependencies.
"""
from typing import List

def tokenize_price_sequence(prices: List[float], scale: int = 1000) -> List[int]:
    """Convert a sequence of price values into deterministic integer tokens.

    Parameters
    ----------
    prices : List[float]
        Sequence of price values (e.g., open, high, low, close).
    scale : int, optional
        Multiplier for quantizing floats to integers (default 1000).

    Returns
    -------
    List[int]
        Integer tokens derived deterministically from the input prices.

    Notes
    -----
    This tokenizer is deterministic: identical prices input always yields the same token list.
    It works offline and does not require any external API keys.
    """
    return [int(round(price * scale)) for price in prices]

class TokenizerService:
    """Service class for tokenization operations."""
    def tokenize(self, prices: List[float], scale: int = 1000) -> List[int]:
        return tokenize_price_sequence(prices, scale)
