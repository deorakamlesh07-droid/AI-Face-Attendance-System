import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    section: { type: String, required: true, trim: true },
    credits: { type: Number, default: 4, min: 1, max: 6 },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);
