import json
import re

import httpx
from sqlalchemy.orm import Session

from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import (
    calculate_budget,
    calculate_distance,
    generate_itinerary_proposal,
    get_user_preferences,
    get_weather_for_destination,
    optimize_itinerary,
    search_places,
)
from app.core.config import get_settings
from app.models import Destination, Trip, User
from app.schemas import AgentResponse, AgentToolCall

settings = get_settings()


class TravelAgent:
    """Autonomous tool-calling travel agent with live weather, route optimization, and budget intelligence."""

    def __init__(self, db: Session, user: User, trip: Trip | None = None):
        self.db = db
        self.user = user
        self.trip = trip
        self.tool_calls: list[AgentToolCall] = []

    def _record(self, name: str, arguments: dict, result) -> None:
        self.tool_calls.append(AgentToolCall(name=name, arguments=arguments, result=result))

    async def plan_trip(self, preferences_text: str | None = None) -> AgentResponse:
        if not self.trip:
            return AgentResponse(reply="Please select or create a trip first so I can synthesize a customized day-by-day itinerary.")

        prefs = get_user_preferences(self.user)
        self._record("get_user_preferences", {}, prefs)

        places = search_places(self.db, self.trip.destination, limit=15)
        self._record("search_places", {"destination": self.trip.destination}, places)

        weather = await get_weather_for_destination(self.db, self.trip.destination)
        self._record("get_weather", {"destination": self.trip.destination}, weather)

        proposal = generate_itinerary_proposal(
            self.db,
            self.trip,
            self.user,
            preference_text=preferences_text,
            weather=weather,
        )
        self._record("generate_itinerary", {"trip_id": self.trip.id}, {"days": len(proposal)})

        # Compute cost metrics for proposal
        est_cost = sum(item.get("estimated_cost", 0) for day in proposal for item in day.get("items", []))
        budget_info = {
            "trip_budget": self.trip.budget,
            "proposed_estimated_cost": est_cost,
            "within_budget": est_cost <= self.trip.budget if self.trip.budget else True,
        }
        self._record("calculate_budget", {"trip_id": self.trip.id}, budget_info)

        rainy_days = [d.get("date") for d in weather.get("daily", []) if d.get("is_rainy")]
        weather_note = f" (Adapted for expected rain on {', '.join(rainy_days[:2])})" if rainy_days else ""

        reply = (
            f"✨ I planned a {len(proposal)}-day tailored itinerary for {self.trip.destination}{weather_note}. "
            f"Estimated activities & stay cost ₹{est_cost:,.0f} against your ₹{self.trip.budget:,.0f} budget. "
            "Review the proposed day-by-day breakdown below and click 'Apply Changes' to save it to your trip."
        )

        if settings.gemini_api_key:
            llm_reply = await self._gemini_narrate(
                f"Summarize this trip plan for the user in 3 short sentences.\nPrefs: {preferences_text}\nProposal days: {len(proposal)}\nBudget: {budget_info}"
            )
            if llm_reply:
                reply = llm_reply

        return AgentResponse(
            reply=reply,
            tool_calls=self.tool_calls,
            proposed_itinerary=proposal,
            requires_approval=True,
        )

    async def optimize_trip(self) -> AgentResponse:
        if not self.trip:
            return AgentResponse(reply="Please select a trip first so I can calculate route metrics and optimize the schedule.")

        prefs = get_user_preferences(self.user)
        self._record("get_user_preferences", {}, prefs)

        weather = await get_weather_for_destination(self.db, self.trip.destination)
        self._record("get_weather", {"destination": self.trip.destination}, weather)

        before = calculate_distance(self.trip)
        self._record("calculate_distance", {"trip_id": self.trip.id}, before)

        optimization = optimize_itinerary(self.db, self.trip, self.user, weather=weather)
        self._record("optimize_itinerary", {"trip_id": self.trip.id}, {
            "before": optimization["before"],
            "after": optimization["after"],
        })

        b, a = optimization["before"], optimization["after"]
        reply = (
            "✨ Trip Optimization Complete!\n\n"
            f"• Route Distance: {b['distance_km']} km ➔ {a['distance_km']} km (Transit minimized)\n"
            f"• Estimated Cost: ₹{b['estimated_cost']:,.0f} ➔ ₹{a['estimated_cost']:,.0f}\n"
            f"• Pacing: {b['activities_per_day']} activities/day ➔ {a['activities_per_day']}/day\n\n"
            "Click 'Apply Changes' below to update your itinerary with this optimized schedule."
        )
        return AgentResponse(
            reply=reply,
            tool_calls=self.tool_calls,
            proposed_itinerary=optimization["proposed_itinerary"],
            optimization={"before": b, "after": a, "summary": optimization["summary"]},
            requires_approval=True,
        )

    async def chat(self, message: str) -> AgentResponse:
        lower = message.lower()

        if self.trip and any(k in lower for k in ["optimize", "less hectic", "reduce travel", "cluster", "minimize distance"]):
            return await self.optimize_trip()

        if self.trip and any(k in lower for k in ["plan", "itinerary", "schedule", "generate plan", "create itinerary"]):
            return await self.plan_trip(preferences_text=message)

        prefs = get_user_preferences(self.user)
        self._record("get_user_preferences", {}, prefs)

        if self.trip:
            budget = calculate_budget(self.trip)
            self._record("calculate_budget", {"trip_id": self.trip.id}, budget)

            if any(k in lower for k in ["budget", "spending", "cost", "expensive", "money", "affordable", "price"]):
                if budget["is_over_budget"]:
                    reply = (
                        f"⚠️ Budget Alert: You are over budget by ₹{abs(budget['remaining']):,.0f}. "
                        f"Current planned & actual spend is ₹{budget['estimated_total'] + budget['actual_total']:,.0f} "
                        f"vs your ₹{budget['trip_budget']:,.0f} budget cap. I recommend optimizing the itinerary to swap premium activities for local gems."
                    )
                else:
                    reply = (
                        f"✅ Budget On Track: You have ₹{budget['remaining']:,.0f} headroom remaining out of your ₹{budget['trip_budget']:,.0f} budget. "
                        f"Estimated activities: ₹{budget['estimated_total']:,.0f}, Actual expenses logged: ₹{budget['actual_total']:,.0f}."
                    )
                return AgentResponse(reply=reply, tool_calls=self.tool_calls)

            if any(k in lower for k in ["weather", "rain", "forecast", "temp", "temperature", "climate"]):
                weather = await get_weather_for_destination(self.db, self.trip.destination)
                self._record("get_weather", {"destination": self.trip.destination}, weather)
                rainy = [d for d in weather.get("daily", []) if d.get("is_rainy")]
                if rainy:
                    reply = (
                        f"🌧️ Weather Forecast for {self.trip.destination}: Rain is anticipated on {', '.join(d['date'] for d in rainy[:3])}. "
                        "I can automatically swap outdoor beach/nature activities with indoor museums, art cafes, or indoor markets."
                    )
                else:
                    daily = weather.get("daily", [])
                    temp_range = f"{daily[0].get('temp_min', 20)}°C – {daily[0].get('temp_max', 30)}°C" if daily else "pleasant"
                    reply = (
                        f"☀️ Weather looks clear and ideal for {self.trip.destination}! Expect temperatures around {temp_range}. "
                        "Great conditions for outdoor exploration, beaches, and sightseeing."
                    )
                return AgentResponse(reply=reply, tool_calls=self.tool_calls)

            places = search_places(self.db, self.trip.destination, limit=6)
            self._record("search_places", {"destination": self.trip.destination}, places)
            names = ", ".join(p["name"] for p in places[:4]) or "local highlights"
            reply = (
                f"For {self.trip.destination}, top recommendations based on your preferences include: {names}. "
                "Ask me to plan your daily schedule, check weather forecasts, or optimize your travel routes."
            )
            if settings.gemini_api_key:
                llm_reply = await self._gemini_narrate(
                    f"User asked: {message}\nKnown places: {json.dumps(places[:5])}\nPrefs: {json.dumps(prefs)}\nReply helpfully in 2-4 sentences."
                )
                if llm_reply:
                    reply = llm_reply
            return AgentResponse(reply=reply, tool_calls=self.tool_calls)

        # No trip context: search known destinations dynamically
        destinations = self.db.query(Destination).all()
        matched_dest = None
        for d in destinations:
            if d.name.lower() in lower:
                matched_dest = d
                break

        if matched_dest:
            places = search_places(self.db, matched_dest.name, limit=5)
            self._record("search_places", {"destination": matched_dest.name}, places)
            weather = await get_weather_for_destination(self.db, matched_dest.name)
            self._record("get_weather", {"destination": matched_dest.name}, weather)
            names = ", ".join(p["name"] for p in places[:3])
            return AgentResponse(
                reply=(
                    f"I found wonderful attractions in {matched_dest.name} (Best season: {matched_dest.best_season}, Avg daily budget: ₹{matched_dest.average_daily_budget:,.0f}). "
                    f"Highlights include: {names}. Create a new trip for {matched_dest.name} and I will build a full day-by-day itinerary for you!"
                ),
                tool_calls=self.tool_calls,
            )

        # General help
        dest_names = ", ".join(d.name for d in destinations[:4]) if destinations else "Goa, Manali, Jaipur"
        return AgentResponse(
            reply=(
                f"I am your AI Travel Agent! I can plan day-by-day itineraries, check live weather, manage budgets, and optimize travel distances. "
                f"Popular destinations available right now: {dest_names}. Select a trip or ask me about any destination to get started."
            ),
            tool_calls=self.tool_calls,
        )

    async def _gemini_narrate(self, prompt: str) -> str | None:
        if not settings.gemini_api_key:
            return None
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.0-flash:generateContent?key={settings.gemini_api_key}"
        )
        body = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{SYSTEM_PROMPT}\n\n{prompt}"}
                    ]
                }
            ]
        }
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(url, json=body)
                response.raise_for_status()
                data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            return None
