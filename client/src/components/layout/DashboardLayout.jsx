import { useAuth } from "../../features/auth/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import { COLLEGE } from "../../lib/college";

export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">{COLLEGE.shortName}</p>
          <h1>{COLLEGE.name}</h1>
          <p className="muted">Face recognition attendance for secure, fast, and auditable college operations.</p>
        </div>
        <div className="profile-card">
          <span className="pill">{user?.role}</span>
          <h3>{user?.name}</h3>
          <p>{user?.email}</p>
          <p>{COLLEGE.campus}</p>
        </div>
        <div className="sidebar-actions">
          <ThemeToggle />
          <button className="ghost-button" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
};
