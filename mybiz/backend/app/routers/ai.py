from fastapi import APIRouter, Depends
from typing import List, Optional
from app.models import User
from app.schemas import AIChatRequest, AIChatResponse, AIRecommendation
from app.auth import get_current_user
from app.services.ai_service import (
    extract_financial_context,
    ask_gemini_or_fallback,
    generate_recommendations
)

router = APIRouter(prefix="/ai", tags=["AI Advisor"])

@router.post("/chat", response_model=AIChatResponse)
async def chat_with_advisor(
    chat_req: AIChatRequest,
    current_user: User = Depends(get_current_user)
):
    ctx = await extract_financial_context(current_user, chat_req.business_id)
    answer, source, intent, decision_rubric, evidence = await ask_gemini_or_fallback(chat_req.question, ctx)
    return AIChatResponse(
        answer=answer,
        source=source,
        intent=intent,
        financial_context=ctx,
        decision_rubric=decision_rubric,
        evidence=evidence
    )

@router.get("/recommendations", response_model=List[AIRecommendation])
async def get_advisor_recommendations(
    business_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    ctx = await extract_financial_context(current_user, business_id)
    return generate_recommendations(ctx)
