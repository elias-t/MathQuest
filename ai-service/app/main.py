from fastapi import FastAPI
from dotenv import load_dotenv
from app.routers import validation

load_dotenv()

app = FastAPI(title="MathQuest AI Service")

app.include_router(validation.router)

@app.get("/")
def root():
    return {"message": "MathQuest AI Service is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}