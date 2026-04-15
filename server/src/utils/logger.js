import winston from "winston";

const { combine, timestamp, printf, colorize } = winston.format;

const line = printf(({ level, message, timestamp: time, stack }) => {
  return `${time} ${level}: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), line),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  ]
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), line)
    })
  );
}
