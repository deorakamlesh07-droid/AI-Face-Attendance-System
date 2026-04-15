import { Router } from "express";
import { getAttendanceLogs, getAttendanceOverview, getAttendancePrediction } from "../controllers/studentController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("student"));
router.get("/:studentId/attendance/overview", getAttendanceOverview);
router.get("/:studentId/attendance/logs", getAttendanceLogs);
router.get("/:studentId/attendance/prediction", getAttendancePrediction);

export default router;
