from chroma_client import problems_collection


def index_problem(
    problem_id: str,
    title: str,
    description: str,
    topic: str,
    difficulty: int,
) -> None:
    document = f"{title}. {description}"
    problems_collection.upsert(
        documents=[document],
        metadatas=[{
            "problem_id": problem_id,
            "title": title,
            "topic": topic,
            "difficulty": difficulty,
        }],
        ids=[problem_id],
    )
