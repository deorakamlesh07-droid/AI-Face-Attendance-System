import { format } from "date-fns";
import { Attendance, Student, Subject } from "../models/index.js";
import { ATTENDANCE_STATUS, SESSION_STATUS } from "../utils/constants.js";

export const getSessionDate = () => format(new Date(), "yyyy-MM-dd");

export const calculateStudentAttendance = async (studentId) => {
  const attendance = await Attendance.find({ student: studentId }).populate("subject", "name code");
  const summary = attendance.reduce(
    (acc, item) => {
      const key = item.subject.code;

      if (!acc.subjects[key]) {
        acc.subjects[key] = {
          subject: item.subject.name,
          code: item.subject.code,
          present: 0,
          total: 0
        };
      }

      acc.subjects[key].total += 1;
      acc.total += 1;

      if (item.status === ATTENDANCE_STATUS.PRESENT || item.status === ATTENDANCE_STATUS.LATE) {
        acc.subjects[key].present += 1;
        acc.present += 1;
      }

      return acc;
    },
    { total: 0, present: 0, subjects: {} }
  );

  const subjects = Object.values(summary.subjects).map((entry) => ({
    ...entry,
    percentage: entry.total ? Number(((entry.present / entry.total) * 100).toFixed(2)) : 0
  }));

  return {
    total: summary.total,
    present: summary.present,
    percentage: summary.total ? Number(((summary.present / summary.total) * 100).toFixed(2)) : 0,
    subjects
  };
};

export const closeSessionWithAbsences = async (session) => {
  const students = await Student.find({
    branch: session.branch,
    year: session.year,
    section: session.section
  });

  const presentIds = new Set(session.recognizedStudents.map((id) => String(id)));
  const markedAt = new Date();

  for (const student of students) {
    const status = presentIds.has(String(student._id))
      ? ATTENDANCE_STATUS.PRESENT
      : ATTENDANCE_STATUS.ABSENT;

    await Attendance.updateOne(
      { student: student._id, subject: session.subject, date: session.date },
      {
        $set: {
          teacher: session.teacher,
          session: session._id,
          branch: session.branch,
          year: session.year,
          section: session.section,
          date: session.date,
          markedAt,
          status
        }
      },
      { upsert: true }
    );
  }

  session.status = SESSION_STATUS.COMPLETED;
  session.endedAt = new Date();
  await session.save();

  return session;
};

export const getTeacherSubjectIds = async (teacherId) => {
  const subjects = await Subject.find({ teacher: teacherId }).select("_id");
  return subjects.map((subject) => subject._id);
};
