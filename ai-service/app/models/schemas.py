from pydantic import BaseModel

class ValidateRequest(BaseModel):
    problem: str
    student_answer: str
    correct_answer: str

class ValidateResponse(BaseModel):
    is_correct: bool
    feedback: str
    encouragement: str
    
class HintRequest(BaseModel):
    problem: str
    correct_answer: str
    previous_hints: list[str] = []

class HintResponse(BaseModel):
    hint: str
    hint_level: int

# RAG schemas
class IndexRequest(BaseModel):
    problem_id: str
    title: str
    description: str
    topic: str
    difficulty: int

class IndexResponse(BaseModel):
    success: bool
    message: str

class TopicPerformance(BaseModel):
    topic: str
    correct: int
    total: int

class RecommendRequest(BaseModel):
    student_id: str
    topic_performance: list[TopicPerformance]
    last_problem_id: str | None = None

class RecommendResponse(BaseModel):
    problem_id: str
    title: str
    topic: str
    difficulty: int
    reasoning: str
    
class GenerateRequest(BaseModel):
    solved_problem: str
    solved_machine_form: str = ""
    variable: str = ""
    topic: str
    difficulty: int
    direction: str = "harder"
    
class GenerateResponse(BaseModel):
    description: str
    machine_form: str
    problem_type: str
    variable: str
    correct_answer: str
    difficulty: int
    solution_steps: list[str]
    new_skill: str  