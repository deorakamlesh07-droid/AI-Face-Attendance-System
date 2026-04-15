import { useEffect, useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { http } from "../api/http";
import { StatCard } from "../components/ui/StatCard";
import { AttendanceTrendChart } from "../components/charts/AttendanceTrendChart";
import { AttendanceStatusChart } from "../components/charts/AttendanceStatusChart";
import { AttendanceSubjectChart } from "../components/charts/AttendanceSubjectChart";
import { COLLEGE } from "../lib/college";

const formatMarkedTime = (value) => {
  if (!value) return "--";

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
};

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const studentId = user?.profile?._id;
    if (!studentId) return;

    Promise.all([
      http.get(`/student/${studentId}/attendance/overview`),
      http.get(`/student/${studentId}/attendance/logs`),
      http.get(`/student/${studentId}/attendance/prediction`)
    ]).then(([overviewRes, logsRes, predictionRes]) => {
      setOverview(overviewRes.data);
      setLogs(logsRes.data.logs);
      setPrediction(predictionRes.data);
    });
  }, [user]);

  const trendData = Object.values(
    logs.reduce((acc, row) => {
      if (!acc[row.date]) {
        acc[row.date] = { name: row.date.slice(5), attendance: 0 };
      }
      if (row.status === "present" || row.status === "late") {
        acc[row.date].attendance += 1;
      }
      return acc;
    }, {})
  );

  const statusData = ["present", "late", "absent", "excused"].map((status) => ({
    name: status,
    value: logs.filter((row) => row.status === status).length
  }));

  const subjectData = (overview?.subjects || []).map((item) => ({
    name: item.code,
    percentage: item.percentage
  }));

  return (
    <div className="dashboard-grid">
      <div>
        <p className="eyebrow">Student panel</p>
        <h2>Attendance health and subject-wise insight</h2>
        <p className="muted">
          Track your attendance at {COLLEGE.name}, review class-wise charts, and monitor your risk before alerts reach
          you and your family.
        </p>
      </div>

      <div className="stats-grid">
        <StatCard title="Overall attendance" value={`${overview?.percentage ?? 0}%`} subtitle="All classes combined" />
        <StatCard title="Present classes" value={overview?.present ?? 0} subtitle="Successfully marked" />
        <StatCard title="Total classes" value={overview?.total ?? 0} subtitle="Tracked lectures" />
        <StatCard title="Prediction" value={`${prediction?.projectedNextWeek ?? 0}%`} subtitle={`Risk: ${prediction?.risk ?? "n/a"}`} />
        <StatCard title="College ID" value={user?.profile?.collegeId || user?.profile?.admissionNo || "--"} subtitle="Student identifier" />
      </div>

      <div className="section-grid">
        <section className="panel">
          <p className="eyebrow">Student identity</p>
          <h3>{user?.name}</h3>
          <div className="detail-grid">
            <div className="profile-card compact-card">
              <span className="pill">College</span>
              <h4>{COLLEGE.name}</h4>
              <p>{user?.profile?.program || "B.Tech program"}</p>
            </div>
            <div className="profile-card compact-card">
              <span className="pill">Class</span>
              <h4>{user?.profile?.branch?.name || "Computer Science"}</h4>
              <p>
                Year {user?.profile?.year} • Semester {user?.profile?.semester} • Section {user?.profile?.section}
              </p>
            </div>
            <div className="profile-card compact-card">
              <span className="pill">Guardian</span>
              <h4>{user?.profile?.guardianName || "N/A"}</h4>
              <p>{user?.profile?.guardianPhone || user?.profile?.parentEmail || "Contact not set"}</p>
            </div>
          </div>
        </section>

        <section className="panel">
          <p className="eyebrow">Alerts</p>
          <h3>Attendance watch</h3>
          <div className="profile-card">
            <span className="pill">{(overview?.percentage ?? 0) < 75 ? "Warning" : "Healthy"}</span>
            <h4>
              {(overview?.percentage ?? 0) < 75
                ? "Your attendance is below the college threshold."
                : "You are above the attendance threshold."}
            </h4>
            <p>Automated alerts are sent when attendance drops below 75%.</p>
          </div>
        </section>
      </div>

      <div className="section-grid">
        <AttendanceTrendChart data={trendData} title="Your attendance timeline" gradientId="studentTrend" />
        <AttendanceStatusChart data={statusData} title="Your status distribution" />
      </div>

      <div className="section-grid">
        <AttendanceSubjectChart data={subjectData} title="Subject-wise performance" />
        <section className="panel">
          <p className="eyebrow">Face dataset</p>
          <h3>Seeded demo images</h3>
          <div className="image-grid">
            {(user?.profile?.sampleFaceImages || []).map((image, index) => (
              <img key={image} src={image} alt={`Student face sample ${index + 1}`} className="face-image" />
            ))}
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            Three demo face images are attached to this student profile for seeded attendance visualization.
          </p>
        </section>
      </div>

      <section className="panel">
        <p className="eyebrow">Subject breakdown</p>
        <h3>Performance by subject</h3>
        {(overview?.subjects || []).map((item) => (
          <div key={item.code} className="profile-card" style={{ marginTop: 12 }}>
            <span className="pill">{item.percentage}%</span>
            <h4>
              {item.subject} ({item.code})
            </h4>
            <p>
              {item.present} present / {item.total} total
            </p>
          </div>
        ))}
      </section>

      <section className="panel">
        <p className="eyebrow">Daily logs</p>
        <h3>Attendance entries</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Date</th>
              <th>Marked time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr key={row._id}>
                <td>{row.subject?.name}</td>
                <td>{row.date}</td>
                <td>{formatMarkedTime(row.markedAt || row.createdAt)}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};
