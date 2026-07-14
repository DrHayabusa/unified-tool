import { Activity, BarChart3, CalendarRange, Radar, Zap } from "lucide-react";

const modes = [
  {
    id: "adhoc",
    title: "Adhoc Scan",
    subtitle: "On-demand immediate file process or live scan.",
    icon: Zap,
    accent: "from-red-500 to-rose-700",
  },
  {
    id: "monthly",
    title: "Monthly Data Comparison",
    subtitle: "Multi-month trends, Excel dashboard mapping, and AI PDF planning.",
    icon: BarChart3,
    accent: "from-red-500 to-rose-700",
  },
  {
    id: "quarterly",
    title: "Quarterly Analysis",
    subtitle: "One current reporting cycle summarized across its latest three months, with a discovery trend and report outputs.",
    icon: CalendarRange,
    accent: "from-red-500 to-rose-700",
  },
  {
    id: "threat-intel",
    title: "Threat Intelligence",
    subtitle: "Investigate a vulnerability or CVE using uploaded scanner evidence, NVIDIA, or your organization API.",
    icon: Radar,
    accent: "from-red-500 to-rose-700",
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
        <Activity className="h-6 w-6 text-red-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {modes.map((item) => {
          const Icon = item.icon;
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onModeChange(item.id)}
              className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition duration-200 ${
                active
                  ? "border-red-400/55 bg-red-500/[0.07]"
                  : "border-white/10 bg-slate-900/55 hover:border-red-300/30 hover:bg-slate-900/80"
              }`}
            >
              <div className={`absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b ${item.accent} ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`} />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-red-400/20 bg-red-500/[0.07] text-red-300">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-black text-white">{item.title}</p>
                  <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-400">{item.subtitle}</p>
                  <p className="mt-4 font-mono text-[0.65rem] font-bold uppercase tracking-[0.16em] text-red-300">
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
