import { Bot, FileText, History, LayoutDashboard, UploadCloud } from "lucide-react";
import { MvaLogo } from "./ToolIcons.jsx";
import { navItems } from "../data/dashboardData.js";

const navIcon = {
  Dashboard: LayoutDashboard,
  Upload: UploadCloud,
  History,
  "AI Agent": Bot,
  Reports: FileText,
};

export function Sidebar({ activePage = "Dashboard" }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-cyan-300/15 bg-slate-950/80 p-6 backdrop-blur-2xl lg:block">
      <div className="mb-9 flex items-center gap-4">
        <MvaLogo />
        <div>
          <p className="text-3xl font-black tracking-tight text-white">MVA</p>
          <p className="text-sm font-semibold text-slate-400">Unified Agent</p>
        </div>
      </div>

      <nav className="space-y-3">
        {navItems.map((item) => {
          const Icon = navIcon[item];
          const isActive = item === activePage;

          return (
            <button
              key={item}
              className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left text-sm font-bold transition ${
                isActive
                  ? "border-emerald-400/50 bg-emerald-400/14 text-white shadow-glow"
                  : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-emerald-300" : "text-slate-500 group-hover:text-cyan-300"}`} />
              {item}
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
