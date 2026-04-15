import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { StatCard } from "../../components/ui/StatCard";
import { AttendanceTrendChart } from "../../components/charts/AttendanceTrendChart";
import api from "../../services/api";

const trendData = [
  { name: "Mon", attendance: 92 },
  { name: "Tue", attendance: 95 },
  { name: "Wed", attendance: 90 },
  { name: "Thu", attendance: 94 },
  { name: "Fri", attendance: 97 }
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("/admin/dashboard", { params: { date: new Date().toISOString().slice(0, 10) } })
      .then(({ data }) => setStats(data.analytics));
  }, []);

  return (
    <div className="dashboard-grid">
      <Navbar title="Admin Dashboard" subtitle="College-wide analytics and governance controls." />
      <div className="stats-grid">
        <StatCard title="Students" value={stats?.totalStudents ?? "--"} subtitle="Registered learners" />
        <StatCard title="Teachers" value={stats?.totalTeachers ?? "--"} subtitle="Active faculty" />
        <StatCard title="Subjects" value={stats?.totalSubjects ?? "--"} subtitle="Mapped subjects" />
        <StatCard title="Today" value={stats?.attendanceToday ?? "--"} subtitle="Attendance records" />
      </div>
      <AttendanceTrendChart data={trendData} />
    </div>
  );
}
