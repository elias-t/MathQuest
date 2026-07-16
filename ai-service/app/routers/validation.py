from fastapi import APIRouter
from app.models.schemas import ValidateRequest, ValidateResponse
from app.services.ai_validator import validate_answer

router = APIRouter(prefix="/validate", tags=["validation"])

@router.post("", response_model=ValidateResponse)
def validate(request: ValidateRequest):
    return validate_answer(request)