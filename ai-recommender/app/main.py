from fastapi import FastAPI, HTTPException
from app.models import (
    UserProfile, RecommendationRequest, RecommendationResponse, RecommendationResult,
    QuickRecommendRequest, ForecastRequest, ForecastResponse, ForecastInsight
)
from app.database import db
from app.vector_store import vector_store
from app.rules import filter_food_items
from app.recommender import recommender_llm
from app.sqs_consumer import start_consumer, demand_tracker

app = FastAPI(title="CloudKitchen AI Service", version="2.0.0")

@app.on_event("startup")
async def startup_event():
    all_food = db.get_all_food()
    vector_store.initialize_db(all_food)
    print(f"Vector DB ready — {len(all_food)} menu items loaded.")
    start_consumer()

@app.get("/api/health")
async def health():
    snapshot = demand_tracker.snapshot()
    return {
        "status": "ok",
        "service": "ai-recommender",
        "menu_items": len(db.get_all_food()),
        "real_orders_tracked": snapshot["total_orders_processed"],
    }

@app.get("/api/demand/realtime")
async def realtime_demand():
    """Returns accumulated real order counts per item from the SQS consumer."""
    return demand_tracker.snapshot()

# ── User Preference Management ─────────────────────────────────────────────

@app.post("/api/update_user_preferences")
async def update_user_preferences(profile: UserProfile):
    db.update_user(profile.user_id, profile.preferences, profile.allergies)
    return {"message": f"Preferences updated for {profile.user_id}"}

# ── Recommendation Endpoints ───────────────────────────────────────────────

@app.post("/api/recommend", response_model=RecommendationResponse)
async def get_recommendations(req: RecommendationRequest):
    """Original endpoint — user must call update_user_preferences first."""
    user = db.get_user(req.user_id)
    if not user:
        # Auto-create with no restrictions so the user still gets results
        db.update_user(req.user_id, [], [])
        user = db.get_user(req.user_id)
    return _run_recommend(user, req.query or "", req.top_k or 3)

@app.post("/api/recommend_quick", response_model=RecommendationResponse)
async def quick_recommend(req: QuickRecommendRequest):
    """Single-step endpoint — send preferences inline, no pre-registration needed."""
    db.update_user("session_user", req.preferences, req.allergies)
    user = db.get_user("session_user")
    return _run_recommend(user, req.query, req.top_k)

# ── Demand Forecast Insights ───────────────────────────────────────────────

@app.post("/api/recommend_forecast", response_model=ForecastResponse)
async def recommend_forecast(req: ForecastRequest):
    """AI-powered inventory insights. Uses real SQS-derived demand when available."""
    insights = []
    for item in req.items:
        real_demand = demand_tracker.get_demand(item.name)
        effective_demand = real_demand if real_demand is not None else item.predicted_demand

        risk, action = _compute_risk(item.inventory, effective_demand)
        insight = recommender_llm.generate_forecast_insight(item, risk)
        insights.append(ForecastInsight(
            id=item.id,
            name=item.name,
            kitchen=item.kitchen,
            inventory=item.inventory,
            predicted_demand=effective_demand,
            risk=risk,
            action=action,
            insight=insight,
        ))
    return ForecastResponse(insights=insights)

# ── Helpers ────────────────────────────────────────────────────────────────

def _run_recommend(user, query: str, top_k: int) -> RecommendationResponse:
    all_food  = db.get_all_food()
    safe_food = filter_food_items(user, all_food)

    if not safe_food:
        return RecommendationResponse(user_id=user.user_id, recommendations=[])

    safe_ids   = [f.id for f in safe_food]
    ranked_ids = vector_store.search(query, safe_ids, top_k)

    results = []
    for f_id in ranked_ids:
        food = db.get_food_by_id(f_id)
        if food:
            reason = recommender_llm.generate_reason(food, user, query)
            results.append(RecommendationResult(food_item=food, reason=reason))

    return RecommendationResponse(user_id=user.user_id, recommendations=results)

def _compute_risk(inventory: int, demand: int):
    gap = demand - inventory
    if gap > 10:
        return "UNDERSTOCK", f"Prepare {gap} more units before peak hours."
    if inventory - demand > 20:
        return "OVERSTOCK", "Offer a 15% flash deal to clear excess inventory."
    return "OPTIMAL", "Stock levels are well-matched to expected demand."
