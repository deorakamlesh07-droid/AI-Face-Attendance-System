import cron from "node-cron";
import { env } from "../config/env.js";
import { Student } from "../models/Student.js";
import { calculateStudentAttendance } from "../services/attendanceService.js";
import { sendEmail } from "../services/emailService.js";

export const startAttendanceAlertJob = () => {
  cron.schedule("0 18 * * *", async () => {
    const students = await Student.find().populate("user", "name email");

    for (const student of students) {
      const summary = await calculateStudentAttendance(student._id);

      if (summary.percentage && summary.percentage < env.lowAttendanceThreshold) {
        await sendEmail({
          to: [student.user.email, student.parentEmail].filter(Boolean).join(","),
          subject: "Low attendance alert",
          html: `<p>${student.user.name} has attendance of ${summary.percentage}%.</p>`
        });
      }
    }
  });
};
