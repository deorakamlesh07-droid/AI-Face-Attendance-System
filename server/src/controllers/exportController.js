import { Attendance } from "../models/index.js";
import { toCsv, toPdfBuffer } from "../services/exportService.js";

export const exportAttendanceCsv = async (req, res) => {
  const records = await Attendance.find().populate("student subject");
  const rows = records.map((record) => ({
    studentId: record.student._id,
    subject: record.subject.name,
    date: record.date,
    status: record.status,
    section: record.section
  }));

  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="attendance.csv"');
  res.send(csv);
};

export const exportAttendancePdf = async (req, res) => {
  const records = await Attendance.find().populate("student subject");
  const rows = records.map((record) => ({
    studentId: record.student._id,
    subject: record.subject.name,
    date: record.date,
    status: record.status,
    section: record.section
  }));

  const pdf = await toPdfBuffer("Attendance Report", rows);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="attendance.pdf"');
  res.send(pdf);
};
