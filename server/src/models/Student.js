import mongoose from "mongoose";

const embeddingSchema = new mongoose.Schema(
  {
    vector: { type: [Number], default: [] },
    version: { type: String, default: "facenet512" },
    capturedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    rollNo: { type: String, required: true, unique: true, uppercase: true, trim: true },
    admissionNo: { type: String, trim: true },
    collegeId: { type: String, trim: true, uppercase: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    program: { type: String, trim: true },
    year: { type: Number, required: true, min: 1, max: 6 },
    semester: { type: Number, min: 1, max: 12 },
    section: { type: String, required: true, trim: true },
    parentEmail: { type: String, required: true, trim: true, lowercase: true },
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    attendanceThreshold: { type: Number, default: 75 },
    sampleFaceImages: { type: [String], default: [] },
    faceEmbeddings: { type: [embeddingSchema], default: [] }
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);
