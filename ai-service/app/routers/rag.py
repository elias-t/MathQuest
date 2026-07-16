from fastapi import APIRouter, HTTPException
from app.models.schemas import IndexRequest, IndexResponse, RecommendRequest, RecommendResponse
from rag.ingest import index_problem
from rag.chains import recommend_next_problem

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/index", response_model=IndexResponse)
def index(request: IndexRequest):
    index_problem(
        problem_id=request.problem_id,
        title=request.title,
        description=request.description,
        topic=request.topic,
        difficulty=request.difficulty,
    )
    return IndexResponse(success=True, message="Problem indexed")


@router.post("/recommend", response_model=RecommendResponse)
def recommend(request: RecommendRequest):
    performance = [p.model_dump() for p in request.topic_performance]
    result = recommend_next_problem(performance, request.last_problem_id)
    if not result:
        raise HTTPException(status_code=404, detail="No suitable problem found")
    return RecommendResponse(**result)
