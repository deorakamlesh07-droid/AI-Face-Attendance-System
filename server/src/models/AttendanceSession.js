import mongoose from "mongoose";
import { SESSION_STATUS } from "../utils/constants.js";

const recognitionEventSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    confidence: Number,
    livenessScore: Number,
    matchedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const attendanceSessionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    status: { type: String, enum: Object.values(SESSION_STATUS), default: SESSION_STATUS.LIVE },
    expectedStudents: { type: Number, default: 0 },
    recognizedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    events: { type: [recognitionEventSchema], default: [] }
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);
