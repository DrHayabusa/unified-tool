import { BarChart3, CalendarRange, LayoutDashboard, Radar, Zap } from "lucide-react";
import { MvaLogo } from "./ToolIcons.jsx";

const navIcon = {
  dashboard: LayoutDashboard,
  adhoc: Zap,
  monthly: BarChart3,
  quarterly: CalendarRange,
  "threat-intel": Radar,
};

const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "adhoc", label: "Adhoc Scan" },
  { id: "monthly", label: "Monthly Compare" },
  { id: "quarterly", label: "Quarterly Analysis" },
  { id: "threat-intel", label: "Threat Intelligence" },
];

export function Sidebar({ activePage = "dashboard", onNavigate }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-cyan-300/15 bg-slate-950/80 p-6 backdrop-blur-2xl lg:block">
      <div className="mb-9 flex items-center gap-4">
        <MvaLogo className="h-20 w-20" />
        <div>
          <p className="text-3xl font-black tracking-tight text-white">MVA</p>
          <p className="text-sm font-semibold text-slate-400">Reporting & Remediation</p>
        </div>
      </div>

      <nav className="space-y-3">
        {navItems.map((item) => {
          const Icon = navIcon[item.id];
          const isActive = item.id === activePage;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate?.(item.id)}
              className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left text-sm font-bold transition ${
                isActive
                  ? "border-red-400/45 bg-red-500/[0.08] text-white"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-red-300" : "text-slate-500 group-hover:text-red-300"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="mini-label mb-3">Agent Status</p>
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,.8)]" />
          <div>
            <p className="text-sm font-bold text-slate-100">Local processing ready</p>
            <p className="text-xs text-slate-500">No database required</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
