from math import asin, cos, radians, sin, sqrt
from datetime import datetime, timedelta


def parse_date(value: str) -> datetime:
    return datetime.strptime(value, "%Y-%m-%d")


def trip_day_count(start_date: str, end_date: str) -> int:
    start = parse_date(start_date)
    end = parse_date(end_date)
    days = (end - start).days + 1
    if days < 1:
        raise ValueError("end_date must be on or after start_date")
    return days


def date_for_day(start_date: str, day_number: int) -> str:
    start = parse_date(start_date)
    return (start + timedelta(days=day_number - 1)).strftime("%Y-%m-%d")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return round(2 * r * asin(sqrt(a)), 2)


def estimate_travel_minutes(distance_km: float) -> int:
    # Rough urban travel estimate ~30 km/h average
    return max(10, int((distance_km / 30) * 60))
