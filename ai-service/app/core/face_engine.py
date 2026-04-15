import base64
from functools import lru_cache
from io import BytesIO
from typing import List, Tuple
from urllib.request import urlopen

import cv2
import numpy as np

from .config import settings


FACE_CASCADE = cv2.CascadeClassifier(f"{cv2.data.haarcascades}haarcascade_frontalface_default.xml")


def ensure_model_ready() -> None:
    # Lightweight OpenCV pipeline; no heavyweight model warm-up is required.
    return None


def decode_base64_image(encoded_image: str) -> np.ndarray:
    if "," in encoded_image:
        encoded_image = encoded_image.split(",", 1)[1]

    image_bytes = base64.b64decode(encoded_image)
    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
      raise ValueError("Unable to decode image")
    return image


def download_image(url: str) -> np.ndarray:
    with urlopen(url, timeout=20) as response:
        image_bytes = response.read()

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Unable to decode remote image: {url}")
    return image


def crop_faces(image: np.ndarray) -> List[np.ndarray]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    detections = FACE_CASCADE.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48))

    faces = []
    height, width = image.shape[:2]
    for (x, y, w, h) in detections:
        pad_x = int(w * 0.12)
        pad_y = int(h * 0.12)
        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(width, x + w + pad_x)
        y2 = min(height, y + h + pad_y)
        faces.append(image[y1:y2, x1:x2])

    return faces


def detect_faces(image: np.ndarray) -> List[np.ndarray]:
    faces = crop_faces(image)
    if faces:
        return faces

    raise ValueError("No valid face detected in image")


def compute_embedding(face_image: np.ndarray) -> List[float]:
    gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
    normalized = cv2.equalizeHist(cv2.resize(gray, (64, 64)))
    histogram = cv2.calcHist([normalized], [0], None, [32], [0, 256]).flatten()
    histogram = histogram / max(np.linalg.norm(histogram), 1e-8)
    thumbnail = cv2.resize(normalized, (16, 16)).flatten().astype("float32") / 255.0
    embedding = np.concatenate([histogram.astype("float32"), thumbnail])
    return embedding.tolist()


def cosine_distance(vector_a: List[float], vector_b: List[float]) -> float:
    a = np.array(vector_a, dtype="float32")
    b = np.array(vector_b, dtype="float32")
    denominator = np.linalg.norm(a) * np.linalg.norm(b)
    if denominator == 0:
        return 1.0
    similarity = np.dot(a, b) / denominator
    return float(1 - similarity)


def liveness_score(face_image: np.ndarray) -> float:
    gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return round(min(1.0, variance / settings.liveness_blur_threshold), 3)


@lru_cache(maxsize=128)
def get_cached_remote_embeddings(url: str) -> Tuple[Tuple[float, ...], ...]:
    image = download_image(url)
    faces = crop_faces(image)
    if not faces:
        return tuple()
    return tuple(tuple(compute_embedding(face)) for face in faces[:3])


def resolve_candidate_embeddings(candidate) -> List[List[float]]:
    if getattr(candidate, "sampleImages", None):
        sample_embeddings = []
        for image_url in candidate.sampleImages:
            sample_embeddings.extend([list(vector) for vector in get_cached_remote_embeddings(image_url)])
        if sample_embeddings:
            return sample_embeddings

    return candidate.embeddings


def match_faces(face_embeddings: List[List[float]], candidates: list) -> Tuple[list, dict]:
    matches = []

    for embedding in face_embeddings:
        best_candidate = None
        best_distance = 10.0

        for candidate in candidates:
            for saved_embedding in resolve_candidate_embeddings(candidate):
                distance = cosine_distance(embedding, saved_embedding)
                if distance < best_distance:
                    best_distance = distance
                    best_candidate = candidate

        if best_candidate and best_distance <= settings.match_threshold:
            confidence = round((1 - (best_distance / settings.match_threshold)) * 100, 2)
            matches.append((best_candidate, confidence))

    seen = set()
    unique_matches = []
    for candidate, confidence in matches:
        if candidate.studentId in seen:
            continue
        seen.add(candidate.studentId)
        unique_matches.append((candidate, confidence))

    return unique_matches, {
        "facesDetected": len(face_embeddings),
        "matchesFound": len(unique_matches),
        "threshold": settings.match_threshold
    }
