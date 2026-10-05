# VoyageAI — AI Travel Planning Platform
> **A full-stack travel planning platform built with FastAPI, PostgreSQL, SQLAlchemy, and React, featuring an AI Travel Agent with tool calling for personalized itinerary generation, budget analysis, weather-aware recommendations, and itinerary optimization.**

---

## 🌟 Key Architecture & Highlights

### 1. Python Backend (FastAPI + SQLAlchemy 2.0)
- **RESTful Endpoints & Schema Validation**: Pydantic v2 schemas and models.
- **Authentication & Security**: Secure JWT bearer tokens, refresh tokens, password hashing with bcrypt, and Role-Based Access Control (RBAC: `USER` / `ADMIN`).
- **Database Architecture**: Relational models in PostgreSQL / SQLite with seed catalog (Destinations, Places, Activities, Hotels, Restaurants).
- **Integrations**: Live weather forecasts from **Open-Meteo** API and distance/haversine travel time metrics.

### 2. Agentic AI Feature (Gemini / Autonomous Tool-Calling)
The AI Agent operates with discrete application tools rather than basic text generation:
- `search_places(destination, category, tags)`: Queries the places database for attractions, dining, and accommodations.
- `get_weather(destination)`: Evaluates forecast and flags rain risks.
- `get_user_preferences()`: Reads travel personality (relaxation, adventure, budget tier, food).
- `calculate_budget()`: Analyzes planned vs actual expenditure and remaining runway.
- `calculate_distance()`: Computes total itinerary route kilometers and travel time.
- `optimize_itinerary()`: Compares before/after efficiency metrics (distance, estimated cost, activities/day).
- **Approval Workflow**: The user reviews the before/after optimization diff and explicitly clicks **"Apply Changes"** to commit updates.

### 3. Modern React Frontend (React 19 + TypeScript + Tailwind CSS)
- **Dashboard**: Overview of trips, wishlist, active budget envelopes, and popular destinations.
- **Itinerary Timeline**: Day-by-day interactive timeline with drag/reorder, place autofill, cost badges, and weather indicators.
- **Interactive AI Travel Agent**: Slide-out drawer with real-time tool execution logs, suggestion chips, and diff approval cards.
- **Budget Tracker**: Expense breakdown bars (Accommodation, Food, Transport, Activities, Misc), logged transactions, and over-budget warnings.
- **Saved Places Wishlist**: Bookmark places for the AI Agent to prioritize in future trips.
- **Admin Module**: RBAC-protected catalog management.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.12+
- Node.js 20+ and npm

### 1. Backend Setup
```bash
# Navigate to backend
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend (defaults to zero-setup SQLite or PostgreSQL)
uvicorn app.main:app --reload --port 8000
```
- API Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies (already installed)
npm install

# Start Vite development server
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Pytest Test Suite
```bash
source backend/venv/bin/activate
PYTHONPATH=backend pytest backend/tests
```

---

## 🐳 Docker Deployment
```bash
# Launch PostgreSQL, FastAPI backend, and React frontend
docker-compose up --build
```

---

## 🔑 Demo Credentials
- **User**: `traveler@example.com` / `securepassword123`
- **Admin**: `admin@travel.com` / `adminpassword123`
