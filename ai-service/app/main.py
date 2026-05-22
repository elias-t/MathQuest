from fastapi import FastAPI

app = FastAPI(title="MathQuest AI Service")

@app.get("/")
def root():
    return {"message": "MathQuest AI Service is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}