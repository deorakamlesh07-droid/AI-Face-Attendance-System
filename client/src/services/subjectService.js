import api from "./api";

export const getReferenceData = async () => (await api.get("/reference-data")).data;
export const getTeacherSubjects = async () => (await api.get("/teacher/subjects")).data;
export const getTeacherRoster = async (params) => (await api.get("/teacher/roster", { params })).data;
export const getAdminStudents = async () => (await api.get("/admin/students")).data;
export const getAdminTeachers = async () => (await api.get("/admin/teachers")).data;
export const createStudent = async (payload) => (await api.post("/admin/students", payload)).data;
export const trainStudentFacesAsAdmin = async (studentId, images) =>
  (await api.post(`/admin/students/${studentId}/faces`, { images })).data;
export const trainStudentFacesAsTeacher = async (studentId, images) =>
  (await api.post(`/teacher/students/${studentId}/faces`, { images })).data;
