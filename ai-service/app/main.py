from fastapi import FastAPI
from dotenv import load_dotenv

# RAG/ChromaDB was removed (it did not fit Azure App Service F1); see git history.
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