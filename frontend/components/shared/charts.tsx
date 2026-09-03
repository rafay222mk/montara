'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';

const defaultAttendance = [
  { day: 'Mon', present: 92, absent: 8 },
  { day: 'Tue', present: 95, absent: 5 },
  { day: 'Wed', present: 89, absent: 11 },
  { day: 'Thu', present: 96, absent: 4 },
  { day: 'Fri', present: 93, absent: 7 },
];

const defaultProgress = [
  { area: 'Practical Life', score: 84 },
  { area: 'Sensorial', score: 72 },
  { area: 'Language', score: 78 },
  { area: 'Math', score: 66 },
  { area: 'Cultural', score: 58 },
];

const tooltipStyle = {
  backgroundColor: '#1b2228',
  border: '1px solid #303a42',
  borderRadius: 8,
  color: '#e9eef0',
  fontSize: 12,
};

export function AttendanceChart({ data = defaultAttendance }: { data?: { day: string; present: number; absent: number }[] }) {
  const chartData = data && data.length > 0 ? data : defaultAttendance;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
        <defs>
          <linearGradient id="attendance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#75c7aa" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#75c7aa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#2a3339" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7e8b91', fontSize: 11 }} />
        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#7e8b91', fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, 'Attendance']} />
        <Area type="monotone" dataKey="present" stroke="#75c7aa" strokeWidth={2} fill="url(#attendance)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProgressChart({ data = defaultProgress }: { data?: { area: string; score: number }[] }) {
  const chartData = data && data.length > 0 ? data : defaultProgress;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="#2a3339" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#7e8b91', fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
        <YAxis type="category" dataKey="area" width={80} axisLine={false} tickLine={false} tick={{ fill: '#a8b2b6', fontSize: 10 }} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, 'Progress']} />
        <Bar dataKey="score" fill="#c7a96b" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  );
}
