import { CalendarDays, Cpu, Database, ShieldCheck } from "lucide-react";
import { MvaLogo } from "./ToolIcons.jsx";

export function HeroHeader() {
  const currentDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="relative overflow-hidden rounded-3xl border border-red-400/20 bg-slate-950/90 shadow-cyber">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />
      <div className="absolute inset-0 bg-cyber-grid bg-[length:56px_56px] opacity-[0.13]" />
      <div className="absolute bottom-0 right-0 h-40 w-40 translate-x-20 translate-y-20 rotate-45 border border-red-500/15" />

      <div className="relative grid gap-7 p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-center">
        <div>
          <div className="mb-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-400/20 bg-black/45">
              <MvaLogo className="h-12 w-12" />
            </div>
            <div>
              <p className="font-mono text-[0.67rem] font-bold uppercase tracking-[0.22em] text-red-300">MVA Operations</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Vulnerability control plane</p>
            </div>
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-[-0.04em] text-white md:text-6xl">
            MVA Vulnerability Agent
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold text-slate-300">
            Unified reporting and remediation
          </p>
          <div className="mt-6 flex flex-wrap gap-2 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">Local normalization</span>
            <span className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">Exploit-aware priority</span>
            <span className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">Report automation</span>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-black/35 p-5" aria-label="MVA system posture">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.18em] text-red-300">Control Plane</p>
              <p className="mt-1 text-sm font-semibold text-slate-300">System posture</p>
            </div>
            <span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-400">
              <CalendarDays className="h-4 w-4 text-red-300" />{currentDate}
            </span>
          </div>
          <div className="grid gap-2">
            <PostureRow icon={Cpu} label="Processing" value="Local browser" />
            <PostureRow icon={Database} label="Data storage" value="No database" />
            <PostureRow icon={ShieldCheck} label="Priority engine" value="Active" status />
          </div>
        </section>
      </div>
    </header>
  );
}

function PostureRow({ icon: Icon, label, value, status = false }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] px-4 py-3">
      <span className="flex items-center gap-3 text-sm font-semibold text-slate-500"><Icon className="h-4 w-4 text-red-300" />{label}</span>
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">{status && <span className="h-2 w-2 rounded-full bg-emerald-400" />}{value}</span>
    </div>
  );
}
