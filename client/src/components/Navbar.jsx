import { useAuth } from "../context/AuthContext";

export default function Navbar({ title, subtitle }) {
  const { user } = useAuth();

  return (
    <header className="panel">
      <p className="eyebrow">{user?.role} workspace</p>
      <h2>{title}</h2>
      {subtitle ? <p className="muted">{subtitle}</p> : null}
    </header>
  );
}
