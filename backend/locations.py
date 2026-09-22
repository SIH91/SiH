"""Location search service used by LocoBiz place fields."""
from __future__ import annotations

import time
from typing import Any

import httpx

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
CACHE_TTL_SECONDS = 600
_cache: dict[tuple[str, str, str], tuple[float, list[dict[str, Any]]]] = {}


def _label(item: dict[str, Any]) -> str:
    parts = [item.get("name"), item.get("admin1"), item.get("country")]
    return ", ".join(part for part in parts if part)


def _normalise(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": item["id"],
        "name": item["name"],
        "label": _label(item),
        "admin1": item.get("admin1"),
        "country": item.get("country"),
        "country_code": item.get("country_code"),
        "latitude": item["latitude"],
        "longitude": item["longitude"],
        "timezone": item.get("timezone"),
        "population": item.get("population"),
    }


async def search_locations(query: str, country_code: str, language: str) -> list[dict[str, Any]]:
    """Search place names without exposing the upstream provider to browsers."""
    key = (query.casefold(), country_code.upper(), language.lower())
    cached = _cache.get(key)
    if cached and cached[0] > time.monotonic():
        return cached[1]

    params = {"name": query, "count": 8, "language": language.lower(), "countryCode": country_code.upper()}
    timeout = httpx.Timeout(5.0, connect=2.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(GEOCODING_URL, params=params)
        response.raise_for_status()
    payload = response.json()
    results = [_normalise(item) for item in payload.get("results", [])]
    _cache[key] = (time.monotonic() + CACHE_TTL_SECONDS, results)
    return results
