import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    years: [{ type: Number, min: 1, max: 6 }],
    sections: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

export const Branch = mongoose.model("Branch", branchSchema);
