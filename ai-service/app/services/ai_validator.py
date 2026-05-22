import os
from anthropic import Anthropic
from dotenv import load_dotenv
from app.models.schemas import ValidateRequest, ValidateResponse

load_dotenv()

# Define the structured output schema as a "tool"
VALIDATION_TOOL = {
    "name": "submit_validation",
    "description": "Submit the validation result for a student's maths answer",
    "input_schema": {
        "type": "object",
        "properties": {
            "is_correct": {
                "type": "boolean",
                "description": "Whether the student's answer is mathematically correct"
            },
            "feedback": {
                "type": "string",
                "description": "A short explanation of why the answer is right or wrong"
            },
            "encouragement": {
                "type": "string",
                "description": "A brief encouraging message for the child"
            }
        },
        "required": ["is_correct", "feedback", "encouragement"]
    }
}

def validate_answer(request: ValidateRequest) -> ValidateResponse:
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""You are a friendly maths tutor for children.

Problem: {request.problem}
Correct answer: {request.correct_answer}
Student's answer: {request.student_answer}

Determine if the student's answer is correct. It may be phrased differently 
but mathematically equivalent (e.g. "eight" = "8", "8.0" = "8").

Use the submit_validation tool to provide your assessment."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",   # ← your original working model
        max_tokens=300,
        tools=[VALIDATION_TOOL],
        tool_choice={"type": "tool", "name": "submit_validation"},
        messages=[{"role": "user", "content": prompt}]
    )

    # With tool_choice forcing the tool, the response is in the tool input
    tool_use = message.content[0]
    data = tool_use.input

    return ValidateResponse(
        is_correct=data["is_correct"],
        feedback=data["feedback"],
        encouragement=data["encouragement"]
    )