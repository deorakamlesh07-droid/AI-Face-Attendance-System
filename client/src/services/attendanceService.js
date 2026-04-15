import api from "./api";

export const getAdminAttendance = async () => (await api.get("/admin/attendance")).data;
export const getTeacherHistory = async () => (await api.get("/teacher/attendance/history")).data;
export const startAttendanceSession = async (payload) => (await api.post("/teacher/attendance/session", payload)).data;
export const recognizeAttendanceFrame = async (sessionId, image) =>
  (await api.post(`/teacher/attendance/session/${sessionId}/recognize`, { image })).data;
export const stopAttendanceSession = async (sessionId) =>
  (await api.patch(`/teacher/attendance/session/${sessionId}/stop`)).data;
export const manualAttendanceOverride = async (sessionId, payload) =>
  (await api.patch(`/teacher/attendance/session/${sessionId}/manual`, payload)).data;
export const getStudentOverview = async (studentId) =>
  (await api.get(`/student/${studentId}/attendance/overview`)).data;
export const getStudentLogs = async (studentId) =>
  (await api.get(`/student/${studentId}/attendance/logs`)).data;
export const getStudentPrediction = async (studentId) =>
  (await api.get(`/student/${studentId}/attendance/prediction`)).data;
