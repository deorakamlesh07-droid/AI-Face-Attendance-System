import { AuditLog } from "../models/AuditLog.js";

export const createAuditLog = async ({ actor, action, entityType, entityId, payload, ipAddress }) => {
  await AuditLog.create({ actor, action, entityType, entityId, payload, ipAddress });
};
