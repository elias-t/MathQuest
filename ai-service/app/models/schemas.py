from pydantic import BaseModel

class ValidateRequest(BaseModel):
    problem: str
    student_answer: str
    correct_answer: str

class ValidateResponse(BaseModel):
    is_correct: bool
    feedback: str
    encouragement: str