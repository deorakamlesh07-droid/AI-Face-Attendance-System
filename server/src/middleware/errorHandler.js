import { StatusCodes } from "http-status-codes";
import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ message: `Route not found: ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  logger.error(err);

  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  res.status(status).json({
    message: err.message || "Something went wrong",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
};
