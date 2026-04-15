import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { Attendance, AttendanceSession, Branch, Schedule, Student, Subject, Teacher, User } from "../models/index.js";

const seed = async () => {
  await connectDb();
  await mongoose.connection.dropDatabase();

  const branch = await Branch.create({
    name: "Computer Science",
    code: "CSE",
    years: [1, 2, 3, 4],
    sections: ["A", "B"]
  });

  await User.create({
    name: "Admin User",
    email: "admin@college.edu",
    password: "Admin@123",
    role: "admin"
  });

  const teacherUser = await User.create({
    name: "Dr. Maya Singh",
    email: "teacher@college.edu",
    password: "Teacher@123",
    role: "teacher",
    phone: "+91 98765 41001"
  });

  const teacher = await Teacher.create({
    user: teacherUser._id,
    employeeId: "EMP1001",
    department: "Computer Science"
  });

  const subjects = await Subject.insertMany([
    {
      name: "Artificial Intelligence",
      code: "AI401",
      branch: branch._id,
      year: 4,
      section: "A",
      credits: 4,
      teacher: teacher._id
    },
    {
      name: "Machine Learning",
      code: "ML402",
      branch: branch._id,
      year: 4,
      section: "A",
      credits: 4,
      teacher: teacher._id
    },
    {
      name: "Data Visualization",
      code: "DV403",
      branch: branch._id,
      year: 4,
      section: "A",
      credits: 3,
      teacher: teacher._id
    },
    {
      name: "Cloud Computing",
      code: "CC404",
      branch: branch._id,
      year: 4,
      section: "A",
      credits: 4,
      teacher: teacher._id
    }
  ]);

  teacher.assignedSubjects = subjects.map((subject) => subject._id);
  await teacher.save();

  await Schedule.insertMany([
    {
      subject: subjects[0]._id,
      teacher: teacher._id,
      branch: branch._id,
      year: 4,
      section: "A",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      room: "AI Lab 1"
    },
    {
      subject: subjects[1]._id,
      teacher: teacher._id,
      branch: branch._id,
      year: 4,
      section: "A",
      dayOfWeek: 2,
      startTime: "11:00",
      endTime: "12:00",
      room: "Innovation Studio"
    },
    {
      subject: subjects[2]._id,
      teacher: teacher._id,
      branch: branch._id,
      year: 4,
      section: "A",
      dayOfWeek: 4,
      startTime: "13:00",
      endTime: "14:00",
      room: "Design Analytics Hall"
    },
    {
      subject: subjects[3]._id,
      teacher: teacher._id,
      branch: branch._id,
      year: 4,
      section: "A",
      dayOfWeek: 5,
      startTime: "15:00",
      endTime: "16:00",
      room: "Cloud Systems Lab"
    }
  ]);

  const studentUser = await User.create({
    name: "Ethan Walker",
    email: "student@college.edu",
    password: "Student@123",
    role: "student",
    phone: "+91 98765 41011",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg"
  });

  const student = await Student.create({
    user: studentUser._id,
    rollNo: "CSE4A001",
    admissionNo: "JIET-2026-001",
    collegeId: "JIETCSE4A001",
    branch: branch._id,
    program: "B.Tech Computer Science and Engineering",
    year: 4,
    semester: 8,
    section: "A",
    parentEmail: "olivia.walker@example.com",
    guardianName: "Olivia Walker",
    guardianPhone: "+91 98765 41012",
    sampleFaceImages: [
      "https://randomuser.me/api/portraits/men/32.jpg",
      "https://randomuser.me/api/portraits/med/men/32.jpg",
      "https://randomuser.me/api/portraits/thumb/men/32.jpg"
    ],
    faceEmbeddings: [
      { version: "facenet512", vector: [0.12, 0.33, 0.54, 0.76] },
      { version: "facenet512", vector: [0.11, 0.31, 0.52, 0.79] },
      { version: "facenet512", vector: [0.13, 0.29, 0.55, 0.74] }
    ]
  });

  const attendanceSeed = [
    ["2026-04-03", subjects[0], "present", 96],
    ["2026-04-04", subjects[1], "late", 91],
    ["2026-04-05", subjects[2], "present", 94],
    ["2026-04-06", subjects[3], "absent", 0],
    ["2026-04-07", subjects[0], "present", 95],
    ["2026-04-08", subjects[1], "present", 93],
    ["2026-04-09", subjects[2], "excused", 0],
    ["2026-04-10", subjects[3], "present", 90],
    ["2026-04-11", subjects[0], "present", 97],
    ["2026-04-12", subjects[1], "present", 92],
    ["2026-04-13", subjects[2], "late", 88],
    ["2026-04-14", subjects[3], "present", 94]
  ];

  const sessions = await Promise.all(
    attendanceSeed.map(async ([date, subject, status, confidence]) => {
      const recognized = status === "present" || status === "late" ? [student._id] : [];
      return AttendanceSession.create({
        teacher: teacher._id,
        subject: subject._id,
        branch: branch._id,
        year: 4,
        section: "A",
        date,
        status: "completed",
        expectedStudents: 1,
        recognizedStudents: recognized,
        startedAt: new Date(`${date}T09:00:00.000Z`),
        endedAt: new Date(`${date}T09:50:00.000Z`),
        events: recognized.length
          ? [
              {
                student: student._id,
                confidence,
                livenessScore: 0.96,
                matchedAt: new Date(`${date}T09:15:00.000Z`)
              }
            ]
          : []
      });
    })
  );

  await Attendance.insertMany(
    attendanceSeed.map(([date, subject, status, confidence], index) => ({
      student: student._id,
      subject: subject._id,
      teacher: teacher._id,
      session: sessions[index]._id,
      branch: branch._id,
      year: 4,
      section: "A",
      date,
      status,
      recognitionConfidence: confidence || undefined,
      source: status === "present" || status === "late" ? "face" : "manual"
    }))
  );

  console.log("Seed complete");
  process.exit(0);
};

seed();
