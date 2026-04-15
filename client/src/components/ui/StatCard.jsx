export const StatCard = ({ title, value, subtitle }) => (
  <div className="stat-card">
    <p>{title}</p>
    <h3>{value}</h3>
    <span>{subtitle}</span>
  </div>
);
