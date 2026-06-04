from fastapi import APIRouter, HTTPException
from app.models.schemas import GenerateRequest, GenerateResponse
from generation.generator import generate_problem
from generation.verify import verify, solution_preserved

router = APIRouter(prefix="/generate-next", tags=["generation"])


@router.post("", response_model=GenerateResponse)
def generate_next(request: GenerateRequest):
    for attempt in range(3):
        result = generate_problem(
            solved_problem=request.solved_problem,
            solved_machine_form=request.solved_machine_form,
            variable=request.variable,
            topic=request.topic,
            difficulty=request.difficulty,
            direction=request.direction,
        )

        if not verify(result):
            print(f"attempt {attempt}: verify failed")
            continue

        if request.direction == "scaffold" and request.solved_machine_form:
            if not solution_preserved(
                request.solved_machine_form,
                request.variable,
                result,
            ):
                print(f"attempt {attempt}: solution_preserved failed")
                continue

        return GenerateResponse(**result)

    raise HTTPException(status_code=422, detail="Could not generate a valid problem")