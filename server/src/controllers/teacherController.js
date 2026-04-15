import { StatusCodes } from "http-status-codes";
import { Attendance, AttendanceSession, Student, Subject, Teacher } from "../models/index.js";
import { closeSessionWithAbsences, getSessionDate } from "../services/attendanceService.js";
import { recognizeFromFrame, registerStudentEmbeddings } from "../services/aiService.js";
import { createAuditLog } from "../services/auditService.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAssignedSubjects = async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id }).populate({
    path: "assignedSubjects",
    populate: { path: "branch", select: "name code" }
  });

  res.json({ subjects: teacher?.assignedSubjects || [] });
};

export const getRoster = async (req, res) => {
  const students = await Student.find({
    branch: req.query.branchId,
    year: req.query.year,
    section: req.query.section
  })
    .populate("user", "name email")
    .populate("branch", "name code")
    .sort({ rollNo: 1 });

  res.json({ students });
};

export const startSession = async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id });
  const students = await Student.find({
    branch: req.body.branchId,
    year: req.body.year,
    section: req.body.section
  });

  const session = await AttendanceSession.create({
    teacher: teacher._id,
    subject: req.body.subjectId,
    branch: req.body.branchId,
    year: req.body.year,
    section: req.body.section,
    date: getSessionDate(),
    expectedStudents: students.length
  });

  await createAuditLog({
    actor: req.user._id,
    action: "ATTENDANCE_SESSION_STARTED",
    entityType: "AttendanceSession",
    entityId: String(session._id),
    payload: req.body,
    ipAddress: req.ip
  });

  res.status(StatusCodes.CREATED).json({ session });
};

export const processRecognitionFrame = async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id });
  const session = await AttendanceSession.findById(req.params.sessionId);
  const markedAt = new Date();
  const students = await Student.find({
    branch: session.branch,
    year: session.year,
    section: session.section
  }).populate("user", "name");

  const candidates = students.map((student) => ({
    studentId: String(student._id),
    name: student.user.name,
    embeddings: student.faceEmbeddings.map((item) => item.vector),
    sampleImages: student.sampleFaceImages || []
  }));

  const result = await recognizeFromFrame({
    sessionId: String(session._id),
    image: req.body.image,
    candidates
  });

  for (const [index, match] of result.matches.entries()) {
    await Attendance.updateOne(
      { student: match.studentId, subject: session.subject, date: session.date },
      {
        $set: {
          teacher: teacher._id,
          session: session._id,
          branch: session.branch,
          year: session.year,
          section: session.section,
          date: session.date,
          markedAt,
          recognitionConfidence: match.confidence,
          markedBy: req.user._id,
          status: "present",
          source: "face"
        }
      },
      { upsert: true }
    );

    if (index < result.matches.length - 1) {
      await delay(2000);
    }
  }

  session.events.push(
    ...result.matches.map((match) => ({
      student: match.studentId,
      confidence: match.confidence,
      livenessScore: match.livenessScore
    }))
  );

  session.recognizedStudents = [
    ...new Set([...session.recognizedStudents.map((id) => String(id)), ...result.matches.map((match) => match.studentId)])
  ];

  await session.save();

  res.json({ matches: result.matches, summary: result.summary });
};

export const stopSession = async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId);
  await closeSessionWithAbsences(session);
  res.json({ session });
};

export const manualOverride = async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id });
  const session = await AttendanceSession.findById(req.params.sessionId);
  const markedAt = new Date();

  const attendance = await Attendance.findOneAndUpdate(
    { student: req.body.studentId, subject: session.subject, date: session.date },
    {
      $set: {
        teacher: teacher._id,
        session: session._id,
        branch: session.branch,
        year: session.year,
        section: session.section,
        date: session.date,
        markedAt,
        status: req.body.status,
        markedBy: req.user._id,
        source: "manual"
      }
    },
    { upsert: true, new: true }
  );

  res.json({ attendance });
};

export const getAttendanceHistory = async (req, res) => {
  const teacher = await Teacher.findOne({ user: req.user._id });
  const subjects = await Subject.find({ teacher: teacher._id }).select("_id");
  const attendance = await Attendance.find({ subject: { $in: subjects.map((subject) => subject._id) } })
    .populate({
      path: "student",
      populate: { path: "user", select: "name" }
    })
    .populate("subject", "name code")
    .sort({ date: -1 });

  res.json({ attendance });
};

export const captureStudentFace = async (req, res) => {
  const response = await registerStudentEmbeddings({
    studentId: req.params.studentId,
    images: req.body.images
  });

  const student = await Student.findByIdAndUpdate(
    req.params.studentId,
    {
      $push: {
        faceEmbeddings: response.embeddings.map((vector) => ({
          vector,
          version: response.modelVersion
        }))
      }
    },
    { new: true }
  );

  res.json({ student });
};
