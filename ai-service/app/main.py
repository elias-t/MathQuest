from fastapi import FastAPI
from dotenv import load_dotenv

# The RAG router is intentionally NOT registered here. ChromaDB was removed
# because it doesn't fit Azure App Service's Free tier (heavy ML deps for
# in-process embeddings, an out-of-date system sqlite3, and CPU-quota burn on
# every build/cold-start). The rag/ package and app/routers/rag.py remain in
# the repo for reference; RAG will be re-implemented on Azure AI Search (managed
# vector store + API embeddings) when the confusion-search feature is built.
# See CLAUDE.md → "RAG: Parked, Not Removed".
from app.routers import validation, hints, generation

load_dotenv()

app = FastAPI(title="MathQuest AI Service")

app.include_router(validation.router)
app.include_router(hints.router)
app.include_router(generation.router)

@app.get("/")
def root():
    return {"message": "MathQuest AI Service is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}