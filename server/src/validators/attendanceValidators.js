import { body } from "express-validator";

export const startSessionValidator = [
  body("subjectId").isMongoId(),
  body("branchId").isMongoId(),
  body("year").isInt({ min: 1, max: 6 }),
  body("section").notEmpty()
];

export const recognizeValidator = [body("image").notEmpty().withMessage("Image payload is required")];
