import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleLinks = {
  admin: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/students", label: "Students" },
    { to: "/admin/teachers", label: "Teachers" },
    { to: "/admin/subjects", label: "Subjects" },
    { to: "/admin/schedule", label: "Schedule" },
    { to: "/admin/reports", label: "Reports" }
  ],
  teacher: [
    { to: "/teacher", label: "Dashboard" },
    { to: "/teacher/take-attendance", label: "Take Attendance" },
    { to: "/teacher/history", label: "History" }
  ],
  student: [
    { to: "/student", label: "Dashboard" },
    { to: "/student/attendance", label: "Attendance" },
    { to: "/student/profile", label: "Profile" }
  ]
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const links = roleLinks[user?.role] || [];

  return (
    <aside className="sidebar">
      <div>
        <p className="eyebrow">AI Attendance</p>
        <h1>Campus Command</h1>
        <p className="muted">High-accuracy face recognition attendance for modern colleges.</p>
      </div>

      <nav className="dashboard-grid">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? "primary-button" : "ghost-button")}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="profile-card">
        <span className="pill">{user?.role}</span>
        <h3>{user?.name}</h3>
        <p>{user?.email}</p>
        <button className="ghost-button" onClick={logout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
