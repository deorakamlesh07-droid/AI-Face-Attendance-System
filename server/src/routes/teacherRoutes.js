import { Router } from "express";
import {
  captureStudentFace,
  getAssignedSubjects,
  getAttendanceHistory,
  getRoster,
  manualOverride,
  processRecognitionFrame,
  startSession,
  stopSession
} from "../controllers/teacherController.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { recognizeValidator, startSessionValidator } from "../validators/attendanceValidators.js";

const router = Router();

router.use(protect, authorize("teacher"));
router.get("/subjects", getAssignedSubjects);
router.get("/roster", getRoster);
router.get("/attendance/history", getAttendanceHistory);
router.post("/attendance/session", startSessionValidator, validate, startSession);
router.post("/attendance/session/:sessionId/recognize", recognizeValidator, validate, processRecognitionFrame);
router.patch("/attendance/session/:sessionId/manual", manualOverride);
router.patch("/attendance/session/:sessionId/stop", stopSession);
router.post("/students/:studentId/faces", captureStudentFace);

export default router;
