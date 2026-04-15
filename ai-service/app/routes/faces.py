from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.core.face_engine import compute_embedding, decode_base64_image, detect_faces, liveness_score, match_faces
from app.models.schemas import MatchResult, RecognizeRequest, RecognizeResponse, RegisterRequest, RegisterResponse

router = APIRouter(prefix="/faces", tags=["faces"])


@router.post("/register", response_model=RegisterResponse)
def register_face_data(payload: RegisterRequest):
    embeddings = []

    for image in payload.images:
        try:
            frame = decode_base64_image(image)
            faces = detect_faces(frame)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        if not faces:
            continue

        embeddings.append(compute_embedding(faces[0]))

    if not embeddings:
        raise HTTPException(status_code=400, detail="No valid face detected in training images")

    return RegisterResponse(
        studentId=payload.studentId,
        embeddings=embeddings,
        modelVersion=settings.model_name,
        facesProcessed=len(embeddings)
    )


@router.post("/recognize", response_model=RecognizeResponse)
def recognize_faces(payload: RecognizeRequest):
    try:
        frame = decode_base64_image(payload.image)
        faces = detect_faces(frame)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    face_embeddings = []
    liveness_scores = []
    for face in faces:
        face_embeddings.append(compute_embedding(face))
        liveness_scores.append(liveness_score(face))

    raw_matches, summary = match_faces(face_embeddings, payload.candidates)
    matches = []

    for index, (candidate, confidence) in enumerate(raw_matches):
        score = liveness_scores[index] if index < len(liveness_scores) else 0.0
        if score < 0.5:
            continue
        matches.append(
            MatchResult(
                studentId=candidate.studentId,
                name=candidate.name,
                confidence=confidence,
                livenessScore=score
            )
        )

    return RecognizeResponse(matches=matches, summary={**summary, "acceptedMatches": len(matches)})
