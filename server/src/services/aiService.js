import axios from "axios";
import { env } from "../config/env.js";

const aiClient = axios.create({
  baseURL: env.aiServiceUrl,
  timeout: 120000
});

export const registerStudentEmbeddings = async ({ studentId, images }) => {
  const { data } = await aiClient.post("/faces/register", { studentId, images });
  return data;
};

export const recognizeFromFrame = async ({ sessionId, image, candidates }) => {
  const { data } = await aiClient.post("/faces/recognize", { sessionId, image, candidates });
  return data;
};

export const healthcheckAi = async () => {
  const { data } = await aiClient.get("/health");
  return data;
};
