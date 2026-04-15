from fastapi import FastAPI

from app.core.config import settings
from app.core.face_engine import ensure_model_ready
from app.routes.faces import router as face_router

app = FastAPI(title=settings.app_name)
app.include_router(face_router)


@app.on_event("startup")
def warm_models():
    ensure_model_ready()


@app.get("/health")
def health():
    return {"status": "ok", "model": settings.model_name}
