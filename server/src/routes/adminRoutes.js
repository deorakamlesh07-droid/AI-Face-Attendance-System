import { Router } from "express";
import {
  captureFaceData,
  createBranch,
  createSchedule,
  createStudent,
  createSubject,
  createTeacher,
  getAttendanceRecords,
  getDashboard,
  listStudents,
  listTeachers,
  listUsers
} from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/dashboard", getDashboard);
router.get("/users", listUsers);
router.get("/students", listStudents);
router.get("/teachers", listTeachers);
router.post("/students", createStudent);
router.post("/teachers", createTeacher);
router.post("/branches", createBranch);
router.post("/subjects", createSubject);
router.post("/schedules", createSchedule);
router.get("/attendance", getAttendanceRecords);
router.post("/students/:studentId/faces", captureFaceData);

export default router;
