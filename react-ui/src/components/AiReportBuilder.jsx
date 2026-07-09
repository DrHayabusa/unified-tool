import { Bot, ChevronDown, ServerCog } from "lucide-react";

const providers = ["Local AI Server", "NVIDIA NIM", "Groq", "OpenRouter", "Template Only"];

export function AiReportBuilder({ selectedMonth, onMonthChange, monthOptions, compact = false }) {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
        <Bot className="h-8 w-8 text-emerald-300" />
        <div>
          <p className="mini-label">AI Report Builder</p>
          <h2 className="text-xl font-black text-white">Remediation Guide PDF</h2>
        </div>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">Select AI Provider</span>
          <div className="relative">
            <select className="w-full appearance-none rounded-2xl border border-emerald-400/45 bg-slate-950/80 px-4 py-4 font-bold text-slate-100 outline-none">
              {providers.map((provider) => (
                <option key={provider}>{provider}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
        </label>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-black text-white">
            <ServerCog className="h-4 w-4 text-cyan-300" />
            AI generation request
          </p>
          <p className="text-sm font-semibold leading-6 text-slate-400">
            Select the target month to generate the PDF remediation plan via AI Server.
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">Target Month</span>
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(event) => onMonthChange(event.target.value)}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-bold text-slate-100 outline-none"
            >
              {monthOptions.map((month) => (
                <option key={month}>{month}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
        </label>

        {!compact && (
          <div className="grid gap-3">
            {providers.slice(0, 3).map((provider, index) => (
              <div key={provider} className="flex items-center gap-3">
                <span className={`h-4 w-4 rounded-full border ${index === 0 ? "border-emerald-400 bg-emerald-400/80" : "border-slate-500"}`} />
                <div>
                  <p className="font-bold text-slate-200">{provider}</p>
                  <p className="text-xs font-semibold text-slate-500">{index === 0 ? "Use your on-premise AI" : "Optional provider route"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="neon-button w-full">
          Generate AI PDF Report
        </button>
      </div>
    </section>
  );
}
