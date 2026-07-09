import { Line, LineChart, ResponsiveContainer } from "recharts";
import { trendRows } from "../data/dashboardData.js";

const trendData = [5, 8, 6, 11, 9, 12, 7, 10, 13, 9, 11, 10].map((value, index) => ({ index, value }));

export function TrendPanel() {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="mini-label">Trend</p>
          <h2 className="mt-1 text-xl font-black text-white">vs previous</h2>
        </div>
        <select className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm font-bold text-slate-300">
          <option>Last 30 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>

      <div className="space-y-3">
        {trendRows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto_130px] items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
            <div>
              <p className="font-bold text-slate-200">{row.label}</p>
              <p className={`text-sm font-black ${row.tone === "green" ? "text-emerald-400" : "text-red-400"}`}>{row.change}</p>
            </div>
            <p className="text-3xl font-black text-white">{row.value}</p>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <Line type="monotone" dataKey="value" stroke={row.tone === "green" ? "#22c55e" : "#ef4444"} strokeWidth={2.4} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
