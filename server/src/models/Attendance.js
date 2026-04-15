import mongoose from "mongoose";
import { ATTENDANCE_STATUS } from "../utils/constants.js";

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "AttendanceSession" },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    date: { type: String, required: true },
    markedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT
    },
    recognitionConfidence: Number,
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    source: { type: String, enum: ["face", "manual", "qr"], default: "face" }
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);
