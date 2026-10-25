from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ctx = extract_financial_context(current_user, db, chat_req.business_id)
    answer, source = await ask_gemini_or_fallback(chat_req.question, ctx)
    return AIChatResponse(
        answer=answer,
        source=source,
        financial_context=ctx
    )

@router.get("/recommendations", response_model=List[AIRecommendation])
def get_advisor_recommendations(
    business_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ctx = extract_financial_context(current_user, db, business_id)
    return generate_recommendations(ctx)
