import { Branch, Schedule, Student, Subject, Teacher } from "../models/index.js";
import { healthcheckAi } from "../services/aiService.js";

export const getReferenceData = async (req, res) => {
  const [branches, subjects, schedules, teachers, students, aiHealth] = await Promise.all([
    Branch.find(),
    Subject.find().populate("branch", "name code"),
    Schedule.find().populate("subject teacher branch"),
    Teacher.find().populate("user", "name email"),
    Student.find().populate("user", "name email"),
    healthcheckAi().catch(() => ({ status: "unreachable" }))
  ]);

  res.json({ branches, subjects, schedules, teachers, students, aiHealth });
};
