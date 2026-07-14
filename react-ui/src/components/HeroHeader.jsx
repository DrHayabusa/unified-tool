import { CalendarDays, ShieldCheck } from "lucide-react";

export function HeroHeader() {
  const currentDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-slate-950/75 p-7 shadow-cyber backdrop-blur-2xl">
      <div className="absolute inset-0 bg-cyber-grid bg-[length:72px_72px] opacity-35" />
      <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full border border-emerald-400/25" />
      <div className="absolute left-[54%] top-10 h-40 w-40 -translate-x-1/2 rounded-full border border-emerald-400/25" />
      <div className="absolute left-[54%] top-24 h-4 w-4 rounded-full bg-emerald-400 shadow-[0_0_30px_rgba(16,185,129,.9)]" />
      <div className="absolute right-20 top-16 hidden h-56 w-[28rem] opacity-70 xl:block">
        <NetworkMap />
      </div>

      <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="mini-label">Command Center</span>
            <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,.85)]" />
          </div>
          <h1 className="max-w-5xl text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">
            Unified Reporting and Remediation
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-semibold text-slate-400">
            MVA vulnerability intake, comparison, and AI-guided remediation cockpit
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-slate-200">
            <CalendarDays className="h-5 w-5 text-cyan-300" />
            {currentDate}
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
            Secure local mode
          </div>
        </div>
      </div>
    </header>
  );
}

function NetworkMap() {
  const nodes = [
    [20, 60, "bg-emerald-400"],
    [105, 25, "bg-red-500"],
    [160, 92, "bg-cyan-300"],
    [245, 38, "bg-emerald-400"],
    [320, 110, "bg-red-500"],
    [390, 58, "bg-cyan-300"],
  ];

  return (
    <div className="relative h-full w-full">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 430 180" aria-hidden="true">
        <path d="M20 60 105 25 160 92 245 38 320 110 390 58" fill="none" stroke="rgba(34,211,238,.34)" strokeWidth="1.6" />
        <path d="M105 25 320 110M160 92 390 58M20 60 245 38" fill="none" stroke="rgba(239,68,68,.28)" strokeWidth="1.2" />
        <path d="M0 150h420M0 120h420M0 90h420M0 60h420M0 30h420" stroke="rgba(255,255,255,.06)" />
      </svg>
      {nodes.map(([left, top, color], index) => (
        <span
          key={`${left}-${top}`}
          className={`absolute h-3 w-3 rounded-full ${color} shadow-[0_0_20px_currentColor]`}
          style={{ left, top, animation: `softPulse ${2 + index * 0.2}s ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}
