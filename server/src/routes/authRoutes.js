import { Router } from "express";
import { login, me } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loginValidator } from "../validators/authValidators.js";

const router = Router();

router.post("/login", loginValidator, validate, login);
router.get("/me", protect, me);

export default router;
