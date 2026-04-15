import { StatusCodes } from "http-status-codes";
import { Attendance, Branch, Schedule, Student, Subject, Teacher, User } from "../models/index.js";
import { createAuditLog } from "../services/auditService.js";
import { registerStudentEmbeddings } from "../services/aiService.js";

export const getDashboard = async (req, res) => {
  const [totalStudents, totalTeachers, totalSubjects, attendanceToday] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    Subject.countDocuments(),
    Attendance.countDocuments({ date: req.query.date })
  ]);

  res.json({
    analytics: {
      totalStudents,
      totalTeachers,
      totalSubjects,
      attendanceToday
    }
  });
};

export const listUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ users });
};

export const listStudents = async (req, res) => {
  const students = await Student.find()
    .populate("user", "name email")
    .populate("branch", "name code")
    .sort({ createdAt: -1 });

  res.json({ students });
};

export const listTeachers = async (req, res) => {
  const teachers = await Teacher.find().populate("user", "name email").sort({ createdAt: -1 });
  res.json({ teachers });
};

export const createStudent = async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: "student"
  });

  const student = await Student.create({
    user: user._id,
    rollNo: req.body.rollNo,
    admissionNo: req.body.admissionNo,
    collegeId: req.body.collegeId,
    branch: req.body.branchId,
    program: req.body.program,
    year: req.body.year,
    semester: req.body.semester,
    section: req.body.section,
    parentEmail: req.body.parentEmail,
    guardianName: req.body.guardianName,
    guardianPhone: req.body.guardianPhone,
    sampleFaceImages: req.body.sampleFaceImages || []
  });

  await createAuditLog({
    actor: req.user._id,
    action: "STUDENT_CREATED",
    entityType: "Student",
    entityId: String(student._id),
    payload: req.body,
    ipAddress: req.ip
  });

  res.status(StatusCodes.CREATED).json({ student });
};

export const createTeacher = async (req, res) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: "teacher"
  });

  const teacher = await Teacher.create({
    user: user._id,
    employeeId: req.body.employeeId,
    department: req.body.department
  });

  res.status(StatusCodes.CREATED).json({ teacher });
};

export const createBranch = async (req, res) => {
  const branch = await Branch.create(req.body);
  res.status(StatusCodes.CREATED).json({ branch });
};

export const createSubject = async (req, res) => {
  const subject = await Subject.create({
    name: req.body.name,
    code: req.body.code,
    branch: req.body.branchId,
    year: req.body.year,
    section: req.body.section,
    credits: req.body.credits,
    teacher: req.body.teacherId || undefined
  });

  if (req.body.teacherId) {
    await Teacher.findByIdAndUpdate(req.body.teacherId, { $addToSet: { assignedSubjects: subject._id } });
  }

  res.status(StatusCodes.CREATED).json({ subject });
};

export const createSchedule = async (req, res) => {
  const schedule = await Schedule.create({
    subject: req.body.subjectId,
    teacher: req.body.teacherId,
    branch: req.body.branchId,
    year: req.body.year,
    section: req.body.section,
    dayOfWeek: req.body.dayOfWeek,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    room: req.body.room
  });

  res.status(StatusCodes.CREATED).json({ schedule });
};

export const captureFaceData = async (req, res) => {
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

  res.json({ student, ai: response });
};

export const getAttendanceRecords = async (req, res) => {
  const filter = {};

  ["branch", "year", "section", "date", "subject"].forEach((key) => {
    if (req.query[key]) {
      filter[key] = req.query[key];
    }
  });

  const attendance = await Attendance.find(filter)
    .populate({
      path: "student",
      populate: { path: "user", select: "name email" }
    })
    .populate("subject", "name code");

  res.json({ attendance });
};
