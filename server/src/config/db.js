import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export const connectDb = async () => {
  await mongoose.connect(env.mongoUri);
  logger.info("MongoDB connected");
};
