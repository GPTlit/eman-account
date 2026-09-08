import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };

export function DailyAreaChart({ data }: { data: { label: string; income: number; expenses: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={60} />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Area type="monotone" dataKey="income" stroke="var(--chart-1)" fill="url(#inc)" strokeWidth={2} />
        <Area type="monotone" dataKey="expenses" stroke="var(--chart-2)" fill="url(#exp)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval={0} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={60} />
        <Tooltip
          cursor={{ fill: "var(--accent)" }}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
