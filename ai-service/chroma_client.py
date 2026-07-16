import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction

client = chromadb.PersistentClient(path="./chroma_data")

problems_collection = client.get_or_create_collection(
    name="problems",
    embedding_function=DefaultEmbeddingFunction(),
)
