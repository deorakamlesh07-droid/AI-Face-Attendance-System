import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const AttendanceTrendChart = ({
  data,
  title = "Attendance trend",
  eyebrow = "Analytics",
  dataKey = "attendance",
  xKey = "name",
  stroke = "#ff8c42",
  gradientId = "trend"
}) => (
  <div className="chart-card">
    <div className="card-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
    </div>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.8} />
            <stop offset="95%" stopColor={stroke} stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
        <XAxis dataKey={xKey} stroke="currentColor" />
        <YAxis stroke="currentColor" />
        <Tooltip />
        <Area type="monotone" dataKey={dataKey} stroke={stroke} fill={`url(#${gradientId})`} />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
