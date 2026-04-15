import { Router } from "express";
import { getReferenceData } from "../controllers/sharedController.js";
import { exportAttendanceCsv, exportAttendancePdf } from "../controllers/exportController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = Router();

router.get("/reference-data", protect, getReferenceData);
router.get("/exports/attendance.csv", protect, authorize("admin"), exportAttendanceCsv);
router.get("/exports/attendance.pdf", protect, authorize("admin"), exportAttendancePdf);

export default router;
