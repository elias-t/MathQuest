import os
from anthropic import Anthropic
from dotenv import load_dotenv
from rag.retrieval import query_problems
from rag.prompts import build_recommendation_prompt

load_dotenv()

RECOMMEND_TOOL = {
    "name": "recommend_problem",
    "description": "Recommend the best next problem for the student",
    "input_schema": {
        "type": "object",
        "properties": {
            "problem_id": {"type": "string", "description": "ID of the recommended problem"},
            "title": {"type": "string", "description": "Title of the recommended problem"},
            "topic": {"type": "string", "description": "Topic of the recommended problem"},
            "difficulty": {"type": "integer", "description": "Difficulty level of the problem"},
            "reasoning": {"type": "string", "description": "Why this problem is best for the student right now"},
        },
        "required": ["problem_id", "title", "topic", "difficulty", "reasoning"],
    },
}


def recommend_next_problem(
    topic_performance: list[dict],
    last_problem_id: str | None = None,
) -> dict | None:
    if not topic_performance:
        return None

    # Find weakest topic (lowest correct/total ratio)
    def weakness_score(p: dict) -> float:
        return p["correct"] / p["total"] if p["total"] > 0 else 0.0

    weakest = min(topic_performance, key=weakness_score)

    candidates = query_problems(weakest["topic"])
    if not candidates:
        return None

    # Exclude the last problem to avoid repetition
    candidates = [c for c in candidates if c["problem_id"] != last_problem_id]
    if not candidates:
        return None

    prompt = build_recommendation_prompt(topic_performance, candidates)

    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=400,
        tools=[RECOMMEND_TOOL],
        tool_choice={"type": "tool", "name": "recommend_problem"},
        messages=[{"role": "user", "content": prompt}],
    )

    return message.content[0].input
