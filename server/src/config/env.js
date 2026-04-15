import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/face-attendance",
  jwtSecret: process.env.JWT_SECRET || "change-me-super-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientUrls: (process.env.CLIENT_URLS || `${process.env.CLIENT_URL || "http://localhost:5173"},http://127.0.0.1:5173`)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "no-reply@college.local",
  lowAttendanceThreshold: Number(process.env.LOW_ATTENDANCE_THRESHOLD || 75)
};
