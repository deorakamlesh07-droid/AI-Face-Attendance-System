import { Attendance } from "../models/index.js";
import { calculateStudentAttendance } from "../services/attendanceService.js";

export const getAttendanceOverview = async (req, res) => {
  const summary = await calculateStudentAttendance(req.params.studentId);
  res.json(summary);
};

export const getAttendanceLogs = async (req, res) => {
  const logs = await Attendance.find({ student: req.params.studentId })
    .populate("subject", "name code")
    .sort({ date: -1, createdAt: -1 });

  res.json({ logs });
};

export const getAttendancePrediction = async (req, res) => {
  const summary = await calculateStudentAttendance(req.params.studentId);
  const trend = summary.percentage >= 85 ? "stable" : summary.percentage >= 75 ? "watch" : "critical";
  const projected = Math.max(summary.percentage - 2.5, 0);

  res.json({
    current: summary.percentage,
    projectedNextWeek: Number(projected.toFixed(2)),
    risk: trend
  });
};
