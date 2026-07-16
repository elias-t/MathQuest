from fastapi import APIRouter
from app.models.schemas import HintRequest, HintResponse
from app.services.ai_hint import generate_hint

router = APIRouter(prefix="/hint", tags=["hints"])

@router.post("", response_model=HintResponse)
def hint(request: HintRequest):
    return generate_hint(request)