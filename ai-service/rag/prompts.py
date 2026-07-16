def build_recommendation_prompt(topic_performance: list[dict], candidates: list[dict]) -> str:
    performance_lines = "\n".join(
        f"  - {p['topic']}: {p['correct']}/{p['total']} correct"
        for p in topic_performance
    )

    candidate_lines = "\n".join(
        f"  [{i+1}] ID={c['problem_id']} | {c['title']} | Topic: {c['topic']} | Difficulty: {c['difficulty']}"
        for i, c in enumerate(candidates)
    )

    return f"""You are an adaptive maths tutor selecting the best next problem for a student.

Student topic performance:
{performance_lines}

Candidate problems to choose from:
{candidate_lines}

Select the single best problem to assign next. Prioritise topics where the student is weakest,
and choose an appropriate difficulty level — not too easy, not overwhelming.

Use the recommend_problem tool to return your choice and explain your reasoning."""
