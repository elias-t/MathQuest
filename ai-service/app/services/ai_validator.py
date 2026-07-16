import os
from anthropic import Anthropic
from dotenv import load_dotenv
from app.models.schemas import ValidateRequest, ValidateResponse

load_dotenv()

VALIDATOR_MODEL = os.getenv("VALIDATOR_MODEL", "claude-sonnet-4-6")

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
                "description": "Short feedback. If the answer is wrong, must NOT reveal the correct answer or show the solution steps — only nudge toward the approach."
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

FEEDBACK RULES (very important):
- If the answer is CORRECT: briefly affirm it. You may reference the answer.
- If the answer is INCORRECT: DO NOT reveal the correct answer. DO NOT show the
  solution steps or worked calculation. DO NOT state or imply the correct
  numeric value. Give a short, encouraging nudge that points to the general
  approach or which idea to revisit (e.g. "check how you expanded the
  brackets"), without giving the answer away. The student should still have
  something to figure out.

Use the submit_validation tool to provide your assessment."""

    message = client.messages.create(
        model=VALIDATOR_MODEL,
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