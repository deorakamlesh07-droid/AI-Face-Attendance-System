import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    department: { type: String, trim: true },
    assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }]
  },
  { timestamps: true }
);

export const Teacher = mongoose.model("Teacher", teacherSchema);
