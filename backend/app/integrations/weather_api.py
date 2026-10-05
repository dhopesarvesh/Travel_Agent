import httpx

from app.services.utils import estimate_travel_minutes, haversine_km


async def get_weather_forecast(latitude: float, longitude: float, days: int = 7) -> dict:
    """Fetch forecast from Open-Meteo (no API key required)."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": "weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "auto",
        "forecast_days": min(days, 16),
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:  # noqa: BLE001
        return {"error": str(exc), "daily": [], "source": "fallback"}

    daily = data.get("daily", {})
    forecasts = []
    for i, date in enumerate(daily.get("time", [])):
        code = daily.get("weathercode", [0])[i]
        precip = daily.get("precipitation_sum", [0])[i]
        forecasts.append(
            {
                "date": date,
                "weather_code": code,
                "temp_max": daily.get("temperature_2m_max", [None])[i],
                "temp_min": daily.get("temperature_2m_min", [None])[i],
                "precipitation_mm": precip,
                "condition": _weather_label(code, precip),
                "is_rainy": precip >= 5 or code in {51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99},
            }
        )
    return {"daily": forecasts, "source": "open-meteo"}


def _weather_label(code: int, precip: float) -> str:
    if precip >= 10 or code in {65, 82, 95, 96, 99}:
        return "Heavy Rain"
    if precip >= 5 or code in {51, 53, 55, 61, 63, 80, 81}:
        return "Rain Expected"
    if code in {71, 73, 75, 77}:
        return "Snow"
    if code in {1, 2, 3}:
        return "Partly Cloudy"
    if code == 0:
        return "Clear"
    return "Mixed"


def calculate_route_metrics(points: list[tuple[float, float]]) -> dict:
    if len(points) < 2:
        return {"total_distance_km": 0, "estimated_travel_minutes": 0, "legs": []}

    legs = []
    total = 0.0
    for i in range(len(points) - 1):
        dist = haversine_km(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1])
        mins = estimate_travel_minutes(dist)
        total += dist
        legs.append({"from_index": i, "to_index": i + 1, "distance_km": dist, "travel_minutes": mins})

    return {
        "total_distance_km": round(total, 2),
        "estimated_travel_minutes": sum(leg["travel_minutes"] for leg in legs),
        "legs": legs,
    }
