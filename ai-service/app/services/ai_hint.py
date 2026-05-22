import os
from anthropic import Anthropic
from dotenv import load_dotenv
from app.models.schemas import HintRequest, HintResponse

load_dotenv()

HINT_TOOL = {
    "name": "submit_hint",
    "description": "Submit a helpful hint for a maths problem",
    "input_schema": {
        "type": "object",
        "properties": {
            "hint": {
                "type": "string",
                "description": "A helpful hint that guides the student without revealing the answer"
            },
            "hint_level": {
                "type": "integer",
                "description": "How direct this hint is (1=subtle, 2=moderate, 3=very direct)"
            }
        },
        "required": ["hint", "hint_level"]
    }
}

def generate_hint(request: HintRequest) -> HintResponse:
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    previous = ""
    if request.previous_hints:
        previous = "Previous hints already given:\n" + "\n".join(
            f"- {h}" for h in request.previous_hints
        )

    prompt = f"""You are a friendly maths tutor for children.

Problem: {request.problem}
Correct answer: {request.correct_answer}

{previous}

Provide ONE helpful hint that guides the student towards the answer 
WITHOUT revealing it directly. If previous hints were given, make this 
one slightly more direct than the last.

Use the submit_hint tool."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        tools=[HINT_TOOL],
        tool_choice={"type": "tool", "name": "submit_hint"},
        messages=[{"role": "user", "content": prompt}]
    )

    data = message.content[0].input

    return HintResponse(
        hint=data["hint"],
        hint_level=data["hint_level"]
    )