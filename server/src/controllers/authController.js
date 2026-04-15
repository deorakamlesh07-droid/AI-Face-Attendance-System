import { StatusCodes } from "http-status-codes";
import { Student, Teacher, User } from "../models/index.js";
import { signToken } from "../utils/tokens.js";
import { createAuditLog } from "../services/auditService.js";

const buildProfile = async (user) => {
  if (user.role === "student") {
    return Student.findOne({ user: user._id }).populate("branch", "name code");
  }

  if (user.role === "teacher") {
    return Teacher.findOne({ user: user._id }).populate({
      path: "assignedSubjects",
      populate: { path: "branch", select: "name code" }
    });
  }

  return null;
};

export const login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");

  if (!user || !(await user.comparePassword(req.body.password))) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid credentials" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  await createAuditLog({
    actor: user._id,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: String(user._id),
    ipAddress: req.ip
  });

  const profile = await buildProfile(user);

  res.json({
    token: signToken(user),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile
    }
  });
};

export const me = async (req, res) => {
  const profile = await buildProfile(req.user);
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profile
    }
  });
};
