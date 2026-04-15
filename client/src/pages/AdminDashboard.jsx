import { useEffect, useState } from "react";
import { http } from "../api/http";
import { StatCard } from "../components/ui/StatCard";
import { AttendanceTrendChart } from "../components/charts/AttendanceTrendChart";
import { AttendanceStatusChart } from "../components/charts/AttendanceStatusChart";
import { AttendanceSubjectChart } from "../components/charts/AttendanceSubjectChart";
import { downloadProtectedFile, filesToBase64 } from "../lib/images";
import { COLLEGE } from "../lib/college";

export const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "Student@123",
    rollNo: "",
    admissionNo: "",
    collegeId: "",
    branchId: "",
    program: "B.Tech Computer Science and Engineering",
    year: 1,
    semester: 1,
    section: "A",
    parentEmail: "",
    guardianName: "",
    guardianPhone: ""
  });
  const [faceTraining, setFaceTraining] = useState({ studentId: "", files: [] });

  useEffect(() => {
    const load = async () => {
      const [dashboardRes, attendanceRes, refRes, studentsRes] = await Promise.all([
        http.get("/admin/dashboard", { params: { date: new Date().toISOString().slice(0, 10) } }),
        http.get("/admin/attendance"),
        http.get("/reference-data"),
        http.get("/admin/students")
      ]);

      setDashboard({ ...dashboardRes.data.analytics, branches: refRes.data.branches, aiHealth: refRes.data.aiHealth });
      setAttendance(attendanceRes.data.attendance);
      setStudents(studentsRes.data.students);
      setForm((current) => ({
        ...current,
        branchId: current.branchId || refRes.data.branches?.[0]?._id || ""
      }));
      setFaceTraining((current) => ({
        ...current,
        studentId: current.studentId || studentsRes.data.students?.[0]?._id || ""
      }));
    };

    load();
  }, []);

  const refreshAdminData = async () => {
    const [attendanceRes, studentsRes] = await Promise.all([http.get("/admin/attendance"), http.get("/admin/students")]);
    setAttendance(attendanceRes.data.attendance);
    setStudents(studentsRes.data.students);
  };

  const createStudent = async (event) => {
    event.preventDefault();
    await http.post("/admin/students", form);
    await refreshAdminData();
    setForm((current) => ({
      ...current,
      name: "",
      email: "",
      rollNo: "",
      admissionNo: "",
      collegeId: "",
      parentEmail: "",
      guardianName: "",
      guardianPhone: ""
    }));
  };

  const trainFaces = async (event) => {
    event.preventDefault();
    const images = await filesToBase64(faceTraining.files);
    await http.post(`/admin/students/${faceTraining.studentId}/faces`, { images });
    setFaceTraining((current) => ({ ...current, files: [] }));
  };

  const statusData = ["present", "late", "absent", "excused"].map((status) => ({
    name: status,
    value: attendance.filter((row) => row.status === status).length
  }));

  const trendData = Object.values(
    attendance.reduce((acc, row) => {
      if (!acc[row.date]) {
        acc[row.date] = { name: row.date.slice(5), attendance: 0 };
      }
      if (row.status === "present" || row.status === "late") {
        acc[row.date].attendance += 1;
      }
      return acc;
    }, {})
  );

  const subjectData = Object.values(
    attendance.reduce((acc, row) => {
      const key = row.subject?.code || row.subject?.name || "Unknown";
      if (!acc[key]) {
        acc[key] = { name: key, present: 0, total: 0, percentage: 0 };
      }
      acc[key].total += 1;
      if (row.status === "present" || row.status === "late") {
        acc[key].present += 1;
      }
      acc[key].percentage = Number(((acc[key].present / acc[key].total) * 100).toFixed(2));
      return acc;
    }, {})
  );

  const overallPercentage = attendance.length
    ? Number(
        (
          (attendance.filter((row) => row.status === "present" || row.status === "late").length / attendance.length) *
          100
        ).toFixed(2)
      )
    : 0;

  const lowAttendanceStudents = students.filter((student) => {
    const rows = attendance.filter((row) => row.student?._id === student._id);
    if (!rows.length) return false;
    const presentRows = rows.filter((row) => row.status === "present" || row.status === "late").length;
    return (presentRows / rows.length) * 100 < 75;
  }).length;

  const demoStudent = students[0];

  return (
    <div className="dashboard-grid">
      <div>
        <p className="eyebrow">Admin panel</p>
        <h2>College-wide attendance intelligence</h2>
        <p className="muted">
          {COLLEGE.name} centralizes attendance analytics, seeded demo data, face-training status, and exports in one
          control room.
        </p>
      </div>

      <div className="stats-grid">
        <StatCard title="Students" value={dashboard?.totalStudents ?? "--"} subtitle="Registered learners" />
        <StatCard title="Teachers" value={dashboard?.totalTeachers ?? "--"} subtitle="Active faculty" />
        <StatCard title="Subjects" value={dashboard?.totalSubjects ?? "--"} subtitle="Mapped subjects" />
        <StatCard title="Attendance %" value={`${overallPercentage}%`} subtitle="Seeded attendance accuracy" />
        <StatCard title="Marked today" value={dashboard?.attendanceToday ?? 0} subtitle="Latest daily records" />
        <StatCard title="Low attendance" value={lowAttendanceStudents} subtitle="Students below 75%" />
        <StatCard title="AI service" value={dashboard?.aiHealth?.status ?? "loading"} subtitle="Recognition health" />
      </div>

      <div className="section-grid">
        <AttendanceTrendChart data={trendData} title="Daily attendance activity" gradientId="adminTrend" />
        <section className="panel">
          <p className="eyebrow">College profile</p>
          <h3>{COLLEGE.name}</h3>
          <div className="detail-grid">
            <div className="profile-card compact-card">
              <span className="pill">Campus</span>
              <h4>{COLLEGE.campus}</h4>
              <p>
                {COLLEGE.city}, {COLLEGE.state}
              </p>
            </div>
            <div className="profile-card compact-card">
              <span className="pill">Demo student</span>
              <h4>{demoStudent?.user?.name || "Loading..."}</h4>
              <p>{demoStudent?.collegeId || demoStudent?.admissionNo || "JIET demo profile"}</p>
            </div>
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            One seeded student profile is preloaded with multiple attendance entries so the admin dashboard shows real
            charts and exports immediately.
          </p>
        </section>
      </div>

      <div className="section-grid">
        <AttendanceStatusChart data={statusData} title="Attendance status mix" />
        <AttendanceSubjectChart data={subjectData} title="Subject performance snapshot" />
      </div>

      <section className="panel">
        <p className="eyebrow">Quick add</p>
        <h3>Create student</h3>
        <form className="form-grid" onSubmit={createStudent}>
          <label className="field">
            <span>Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="field">
            <span>Roll No</span>
            <input value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />
          </label>
          <label className="field">
            <span>College ID</span>
            <input value={form.collegeId} onChange={(e) => setForm({ ...form, collegeId: e.target.value })} />
          </label>
          <label className="field">
            <span>Admission No</span>
            <input value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
          </label>
          <label className="field">
            <span>Branch</span>
            <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              {(dashboard?.branches || []).map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Program</span>
            <input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
          </label>
          <label className="field">
            <span>Year</span>
            <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}>
              {[1, 2, 3, 4].map((year) => (
                <option key={year} value={year}>
                  Year {year}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Semester</span>
            <select value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Section</span>
            <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} />
          </label>
          <label className="field">
            <span>Parent email</span>
            <input value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} />
          </label>
          <label className="field">
            <span>Guardian</span>
            <input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
          </label>
          <label className="field">
            <span>Guardian phone</span>
            <input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          </label>
          <button className="primary-button" style={{ alignSelf: "end" }}>
            Create student
          </button>
        </form>
      </section>

      <section className="panel">
        <p className="eyebrow">Seeded profile</p>
        <h3>Demo face dataset</h3>
        <div className="image-grid">
          {(demoStudent?.sampleFaceImages || []).map((image, index) => (
            <img key={image} src={image} alt={`Seeded face sample ${index + 1}`} className="face-image" />
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="card-header">
          <div>
            <p className="eyebrow">Audit-ready log</p>
            <h3>Attendance records</h3>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="ghost-button"
              onClick={() =>
                downloadProtectedFile(
                  `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/exports/attendance.csv`,
                  "attendance.csv"
                )
              }
            >
              Export CSV
            </button>
            <button
              className="ghost-button"
              onClick={() =>
                downloadProtectedFile(
                  `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/exports/attendance.pdf`,
                  "attendance.pdf"
                )
              }
            >
              Export PDF
            </button>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>College ID</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((row) => (
              <tr key={row._id}>
                <td>{row.student?.user?.name || "Unknown"}</td>
                <td>{row.student?.collegeId || row.student?.admissionNo || "N/A"}</td>
                <td>{row.subject?.name || "N/A"}</td>
                <td>{row.date}</td>
                <td>
                  <span className="status-tag">{row.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <p className="eyebrow">Face training</p>
        <h3>Capture student dataset</h3>
        <form className="form-grid" onSubmit={trainFaces}>
          <label className="field">
            <span>Student</span>
            <select
              value={faceTraining.studentId}
              onChange={(e) => setFaceTraining({ ...faceTraining, studentId: e.target.value })}
            >
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.user?.name} ({student.rollNo})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Upload face images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFaceTraining({ ...faceTraining, files: e.target.files })}
            />
          </label>
          <button className="primary-button" style={{ alignSelf: "end" }}>
            Train embeddings
          </button>
        </form>
      </section>
    </div>
  );
};
