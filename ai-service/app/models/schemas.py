from typing import List
from pydantic import BaseModel, Field


class Candidate(BaseModel):
    studentId: str
    name: str
    embeddings: List[List[float]] = Field(default_factory=list)
    sampleImages: List[str] = Field(default_factory=list)


class RegisterRequest(BaseModel):
    studentId: str
    images: List[str]


class RegisterResponse(BaseModel):
    studentId: str
    embeddings: List[List[float]]
    modelVersion: str
    facesProcessed: int


class RecognizeRequest(BaseModel):
    sessionId: str
    image: str
    candidates: List[Candidate]


class MatchResult(BaseModel):
    studentId: str
    name: str
    confidence: float
    livenessScore: float


class RecognizeResponse(BaseModel):
    matches: List[MatchResult]
    summary: dict
