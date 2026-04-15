import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { startAttendanceAlertJob } from "./jobs/attendanceAlerts.js";

const start = async () => {
  try {
    await connectDb();
    app.listen(env.port, () => {
      logger.info(`Server listening on port ${env.port}`);
    });
    startAttendanceAlertJob();
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};

start();
