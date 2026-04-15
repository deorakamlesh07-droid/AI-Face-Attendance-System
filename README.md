# AI-Face-Attendance-System

AI-Based Face Recognition Attendance System for Colleges

Production-ready full-stack attendance platform with:

- React frontend with Admin, Teacher, and Student dashboards
- Node.js + Express API with JWT auth, RBAC, audit logs, exports, and email alerts
- MongoDB data layer with Mongoose models
- FastAPI face-recognition microservice using DeepFace / FaceNet-style embeddings
- Real-time attendance sessions, face training, manual overrides, and subject-wise analytics

## Folder Structure

```text
.
|-- ai-service/
|   |-- app/
|   |   |-- core/
|   |   |-- models/
|   |   `-- routes/
|   |-- storage/
|   |-- Dockerfile
|   `-- requirements.txt
|-- client/
|   |-- src/
|   |   |-- api/
|   |   |-- app/
|   |   |-- components/
|   |   |-- features/
|   |   |-- lib/
|   |   |-- pages/
|   |   `-- styles/
|   |-- Dockerfile
|   `-- package.json
|-- server/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- jobs/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- validators/
|   |-- Dockerfile
|   `-- package.json
|-- docker-compose.yml
`-- docs/
```

## Core Features

- Admin: analytics dashboard, CRUD foundations, face training, attendance filters, CSV/PDF export
- Teacher: assigned-subject access, live session start/stop, webcam scanning, manual override, restricted training
- Student: attendance percentage, subject-wise logs, prediction/risk view
- AI: face detection, embedding generation, multi-face matching, lightweight liveness heuristic
- Security: JWT auth, role-based authorization, bcrypt hashing, validation, helmet, CORS, logging
- Alerts: SMTP email integration for low-attendance notifications

## Local Setup

### 1. Server

```bash
cd server
# copy .env.example to .env
npm install
npm run seed
npm run dev
```

### 2. AI service

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# copy .env.example to .env
uvicorn app.main:app --reload --port 8000
```

### 3. Client

```bash
cd client
# copy .env.example to .env
npm install
npm run dev
```

## Docker Setup

```bash
docker compose up --build
```

## Demo Credentials

Use these seeded accounts after running `npm run seed` inside `server`:

- Admin: `admin@college.edu` / `Admin@123`
- Teacher: `teacher@college.edu` / `Teacher@123`
- Student: `student@college.edu` / `Student@123`

Run `npm run seed` inside `server` before first login.

## Important API Areas

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/dashboard`
- `POST /api/admin/students`
- `POST /api/admin/students/:studentId/faces`
- `POST /api/teacher/attendance/session`
- `POST /api/teacher/attendance/session/:sessionId/recognize`
- `PATCH /api/teacher/attendance/session/:sessionId/manual`
- `PATCH /api/teacher/attendance/session/:sessionId/stop`
- `GET /api/student/:studentId/attendance/overview`
- `GET /api/student/:studentId/attendance/prediction`

## Email Configuration

Set these in `server/.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Gmail users typically need an app password instead of their main account password.

## Face Recognition Notes

- The AI service stores embeddings in MongoDB through the server, not raw images.
- Training expects multiple base64 images uploaded from the admin or teacher panels.
- Recognition accepts a live webcam frame and compares it against stored embeddings for the active class roster.
- Basic anti-spoofing uses image sharpness as a lightweight liveness gate. For high-security deployments, replace it with a stronger challenge-response or blink model.

## Deployment Notes

- Frontend: Vercel or Netlify
- Server: Render, Railway, AWS Elastic Beanstalk, or ECS
- AI service: Render background service, EC2, or ECS with CPU/GPU sizing based on throughput
- Database: MongoDB Atlas
- Storage: Extend face-image uploads to S3 if you want archival copies before embedding

## License

This repository, `AI-Face-Attendance-System`, is licensed under the MIT License. See the [LICENSE] file for details.

## Testing Instructions

1. Seed the database.
2. Log in as admin and create branches, teachers, students, and subjects if needed.
3. Upload 8-15 student face images from the admin dashboard.
4. Log in as teacher and start a session for the mapped subject.
5. Scan live webcam frames.
6. Stop the session and verify present/absent records.
7. Log in as student and confirm the updated percentage and logs.
8. Export attendance reports as CSV/PDF.

Additional dataset tips are in [docs/sample-dataset.md](/d:/itr/New%20folder/ai-attendance-system/docs/sample-dataset.md).
