from chroma_client import problems_collection


def query_problems(topic: str, n_results: int = 5) -> list[dict]:
    count = problems_collection.count()
    if count == 0:
        return []

    results = problems_collection.query(
        query_texts=[topic],
        n_results=min(n_results, count),
        where={"topic": {"$eq": topic}},
    )

    candidates = []
    for i, metadata in enumerate(results["metadatas"][0]):
        candidates.append({
            "problem_id": metadata["problem_id"],
            "title": metadata["title"],
            "topic": metadata["topic"],
            "difficulty": metadata["difficulty"],
            "document": results["documents"][0][i],
        })
    return candidates
