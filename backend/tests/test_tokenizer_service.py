"""Unit tests for tokenizer service."""

import pytest
from app.services.tokenizer_service import tokenize_price_sequence, TokenizerService


def test_tokenize_empty():
    assert tokenize_price_sequence([]) == []


def test_tokenize_single():
    assert tokenize_price_sequence([12345.6789]) == [12345679]  # round to nearest int after scaling by 1000


def test_tokenize_multiple():
    prices = [1.234, 5.678, 9.012]
    tokens = tokenize_price_sequence(prices)
    expected = [1234, 5678, 9012]
    assert tokens == expected


def test_tokenize_negative():
    prices = [-1.5, -2.5]
    tokens = tokenize_price_sequence(prices)
    # round(-1.5*1000) = -1500, round(-2.5*1000) = -2500
    assert tokens == [-1500, -2500]


def test_tokenize_deterministic():
    prices = [3.14159, 2.71828]
    t1 = tokenize_price_sequence(prices)
    t2 = tokenize_price_sequence(prices)
    assert t1 == t2


def test_tokenize_service_class():
    service = TokenizerService()
    assert service.tokenize([1.0]) == [1000]
