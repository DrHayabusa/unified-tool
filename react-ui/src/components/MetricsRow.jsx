import { Line, LineChart, ResponsiveContainer } from "recharts";
import { ShieldAlert } from "lucide-react";
import { metricCards } from "../data/dashboardData.js";

export function MetricsRow() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metricCards.map((metric) => {
        const chartData = metric.data.map((value, index) => ({ index, value }));

        return (
          <article key={metric.label} className="cyber-card cyber-card-hover relative min-h-52 overflow-hidden p-5">
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-15 blur-xl" style={{ backgroundColor: metric.color }} />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-slate-400">{metric.label}</p>
                <p className="mt-3 text-5xl font-black tracking-[-0.08em] text-white">{metric.value}</p>
                <p className="mt-1 text-sm font-bold" style={{ color: metric.color }}>
                  {metric.helper}
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
                <ShieldAlert className="h-6 w-6" style={{ color: metric.color }} />
              </div>
            </div>

            <div className="relative z-10 mt-5 h-14 rounded-xl bg-slate-950/35 px-1 py-1">
              <ResponsiveContainer width="100%" height={48}>
                <LineChart data={chartData} margin={{ top: 8, right: 4, bottom: 4, left: 4 }}>
                  <Line
                    dataKey="value"
                    type="monotone"
                    stroke={metric.color}
                    strokeWidth={3}
                    isAnimationActive={false}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        );
      })}
    </section>
  );
}
