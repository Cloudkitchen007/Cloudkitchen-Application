"""
AI recommendation and forecast engine.

Uses LangChain LCEL chains backed by Mistral-7B-Instruct via the HuggingFace
Inference API (free tier). No GPU or local model required — inference runs on
HuggingFace's servers. Falls back to rule-based templates when the token is absent.

Set env vars:
  HUGGINGFACEHUB_API_TOKEN  — free token from huggingface.co/settings/tokens
  HF_MODEL                  — optional, default: mistralai/Mistral-7B-Instruct-v0.3
"""

import logging
import os

from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.models import FoodItem, ForecastItem, UserProfile

logger = logging.getLogger(__name__)

# ── Prompt templates ────────────────────────────────────────────────────────

_RECOMMEND_SYSTEM = """\
You are CloudKitchen's personal AI chef assistant — warm, knowledgeable, and concise.
You help users find dishes that precisely match their cravings and dietary needs.
Be specific: echo the user's own words back and connect them directly to the dish's
real qualities (ingredients, flavour, texture, category).
Never be vague or generic. Write in 1–2 sentences only."""

_RECOMMEND_HUMAN = """\
User's craving: "{query}"
Dietary preferences: {preferences}
Allergens to avoid: {allergies}

Recommended dish: {food_name} ({category})
Description: {food_description}
Key ingredients: {ingredients}

Explain in 1–2 sentences why this is the perfect match. Reference their actual words."""

_FORECAST_SYSTEM = """\
You are a kitchen operations analyst for a cloud kitchen platform.
Give precise, actionable inventory recommendations to prevent food waste (overstocking)
and order failures (understocking). Be specific with numbers and business impact.
Write in 1–2 sentences only."""

_FORECAST_HUMAN = """\
Kitchen: {kitchen}
Item: {item_name}
Current stock: {inventory} portions
Predicted demand: {predicted_demand} orders
Risk: {risk}  |  Gap: {gap} units {gap_direction}
Context: {context}

Give one precise operational recommendation with business impact."""

# ── LLM builder ──────────────────────────────────────────────────────────────


def _build_llm() -> ChatHuggingFace | None:
    token = os.environ.get("HUGGINGFACEHUB_API_TOKEN", "").strip()
    if not token:
        logger.warning(
            "HUGGINGFACEHUB_API_TOKEN not set — AI features will use rule-based fallback. "
            "Get a free token at huggingface.co/settings/tokens and set the env var."
        )
        return None

    model = os.environ.get("HF_MODEL", "mistralai/Mistral-7B-Instruct-v0.3").strip()
    try:
        endpoint = HuggingFaceEndpoint(
            repo_id=model,
            huggingfacehub_api_token=token,
            max_new_tokens=150,
            temperature=0.6,
            task="text-generation",
        )
        llm = ChatHuggingFace(llm=endpoint)
        logger.info("LangChain + HuggingFace Inference API (%s) initialised.", model)
        return llm
    except Exception as exc:
        logger.warning("HuggingFace LLM init failed (%s) — using rule-based fallback.", exc)
        return None


# ── Main class ───────────────────────────────────────────────────────────────


class RecommenderLLM:
    def __init__(self):
        llm = _build_llm()

        if llm:
            self._recommend_chain = (
                ChatPromptTemplate.from_messages(
                    [("system", _RECOMMEND_SYSTEM), ("human", _RECOMMEND_HUMAN)]
                )
                | llm
                | StrOutputParser()
            )
            self._forecast_chain = (
                ChatPromptTemplate.from_messages(
                    [("system", _FORECAST_SYSTEM), ("human", _FORECAST_HUMAN)]
                )
                | llm
                | StrOutputParser()
            )
        else:
            self._recommend_chain = None
            self._forecast_chain  = None

    # ── Public API ────────────────────────────────────────────────────────────

    def generate_reason(self, food: FoodItem, user: UserProfile, query: str) -> str:
        if self._recommend_chain:
            try:
                return self._recommend_chain.invoke({
                    "query":            query,
                    "preferences":      ", ".join(user.preferences) if user.preferences else "no special diet",
                    "allergies":        ", ".join(user.allergies)   if user.allergies   else "no known allergies",
                    "food_name":        food.name,
                    "category":         food.category,
                    "food_description": food.description,
                    "ingredients":      ", ".join(food.ingredients),
                }).strip()
            except Exception as exc:
                logger.warning("LLM recommend call failed (%s) — template fallback.", exc)

        return self._template_reason(food, user, query)

    def generate_forecast_insight(self, item: ForecastItem, risk: str) -> str:
        gap           = abs(item.predicted_demand - item.inventory)
        gap_direction = "short of demand" if risk == "UNDERSTOCK" else "above demand"

        if self._forecast_chain:
            try:
                return self._forecast_chain.invoke({
                    "kitchen":          item.kitchen,
                    "item_name":        item.name,
                    "inventory":        item.inventory,
                    "predicted_demand": item.predicted_demand,
                    "risk":             risk,
                    "gap":              gap,
                    "gap_direction":    gap_direction,
                    "context":          self._forecast_context(risk, gap, item.name),
                }).strip()
            except Exception as exc:
                logger.warning("LLM forecast call failed (%s) — template fallback.", exc)

        return self._fallback_insight(item, risk, gap)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _template_reason(self, food: FoodItem, user: UserProfile, query: str) -> str:
        tags    = set(food.dietary_tags)
        q       = query.lower()
        reasons = []

        if "vegan" in user.preferences and "vegan" in tags:
            reasons.append("it's 100% plant-based")
        elif "vegetarian" in user.preferences and ("vegetarian" in tags or "vegan" in tags):
            reasons.append("it's fully vegetarian")

        if "contains_dairy"   in user.allergies and "contains_dairy"   not in tags:
            reasons.append("it's completely dairy-free")
        if "contains_gluten"  in user.allergies and "contains_gluten"  not in tags:
            reasons.append("it's gluten-free")
        if "contains_nuts"    in user.allergies and "contains_nuts"    not in tags:
            reasons.append("it contains no nuts")
        if "contains_seafood" in user.allergies and "contains_seafood" not in tags:
            reasons.append("it's seafood-free")

        if any(w in q for w in ["spicy", "hot", "fiery", "kick"]) and "spicy" in tags:
            reasons.append("it delivers exactly the spicy kick you're craving")
        if any(w in q for w in ["light", "healthy", "diet", "low cal", "clean", "fresh"]) and "healthy" in tags:
            reasons.append("it's a nutritious, low-calorie option")
        if any(w in q for w in ["hearty", "filling", "rich", "heavy", "comfort"]) and food.category == "Main Course":
            reasons.append("it's a hearty main that will keep you full")
        if any(w in q for w in ["sweet", "dessert", "indulge", "treat"]) and food.category == "Dessert":
            reasons.append("it perfectly satisfies your sweet tooth")

        if reasons:
            return f"Great match — {' and '.join(reasons[:2])}, perfectly aligned with your preferences."
        return f"A safe and delicious {food.category.lower()} that fits your dietary profile seamlessly."

    @staticmethod
    def _forecast_context(risk: str, gap: int, name: str) -> str:
        if risk == "UNDERSTOCK":
            return f"{'Critical' if gap > 25 else 'Low'} stock — {name} may run out before next prep window."
        if risk == "OVERSTOCK":
            return f"{name} has {gap} surplus units that risk spoiling if not moved quickly."
        return "Inventory and demand are well-matched for current service."

    @staticmethod
    def _fallback_insight(item: ForecastItem, risk: str, gap: int) -> str:
        if risk == "UNDERSTOCK":
            return (
                f"Demand exceeds stock by {gap} units — prep more {item.name} immediately "
                f"to avoid a stockout. Estimated revenue at risk: ₹{gap * 250:,}."
            )
        if risk == "OVERSTOCK":
            return (
                f"Stock exceeds demand by {gap} units — run a 15% flash deal on {item.name} "
                f"to clear excess before spoilage. Potential waste: ₹{gap * 180:,}."
            )
        return (
            f"Inventory and demand are well-balanced at ~{item.predicted_demand} orders. "
            f"Maintain current prep levels for {item.name}."
        )


recommender_llm = RecommenderLLM()
