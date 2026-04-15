import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const AttendanceSubjectChart = ({
  data,
  title = "Subject-wise attendance",
  eyebrow = "Subjects",
  dataKey = "percentage",
  fill = "#0ea5e9"
}) => (
  <div className="chart-card">
    <div className="card-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey="name" stroke="currentColor" />
        <YAxis stroke="currentColor" />
        <Tooltip />
        <Bar dataKey={dataKey} radius={[10, 10, 0, 0]} fill={fill} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
