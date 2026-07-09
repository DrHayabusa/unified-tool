import { Activity, BarChart3, Zap } from "lucide-react";

const modes = [
  {
    id: "adhoc",
    title: "Adhoc Scan",
    subtitle: "On-demand immediate file process or live scan.",
    icon: Zap,
    accent: "from-cyan-400 to-emerald-400",
  },
  {
    id: "monthly",
    title: "Monthly Data Comparison",
    subtitle: "Multi-month trends, Excel dashboard mapping, and AI PDF planning.",
    icon: BarChart3,
    accent: "from-amber-300 to-orange-500",
  },
];

export function OperationMode({ mode, onModeChange }) {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="mini-label">Step 02</p>
          <h2 className="mt-1 text-2xl font-black text-white">Operation Mode Selection</h2>
        </div>
        <Activity className="h-6 w-6 text-cyan-300" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              className={`group relative overflow-hidden rounded-3xl border p-6 text-left transition duration-200 ${
                active
                  ? "border-emerald-300/60 bg-emerald-400/12 shadow-glow"
                  : "border-white/10 bg-slate-900/55 hover:-translate-y-1 hover:border-cyan-300/35"
              }`}
            >
              <div className={`absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${item.accent} opacity-15 blur-xl`} />
              <div className="relative flex items-start gap-5">
                <div className={`grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${item.accent} text-slate-950 shadow-glow`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{item.title}</p>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-400">{item.subtitle}</p>
                  <p className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                    {active ? "Active workflow" : "Select workflow"}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
