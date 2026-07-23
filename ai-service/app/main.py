# ChromaDB requires sqlite3 >= 3.35.0, but Azure App Service's system sqlite3
# is older. Swap in the newer pysqlite3-binary BEFORE anything imports chromadb
# (the rag router pulls in chroma_client). On local dev pysqlite3 isn't
# installed, so we fall back to the stdlib sqlite3 (which is new enough).
try:
    __import__("pysqlite3")
    import sys

    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
except ImportError:
    pass

from fastapi import FastAPI
from dotenv import load_dotenv
from app.routers import validation, hints, rag, generation

load_dotenv()

app = FastAPI(title="MathQuest AI Service")

app.include_router(validation.router)
app.include_router(hints.router)
app.include_router(rag.router)
app.include_router(generation.router)

@app.get("/")
def root():
    return {"message": "MathQuest AI Service is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}