import { CheckCircle2 } from "lucide-react";
import { mappedFields } from "../data/dashboardData.js";

export function FieldMappingPanel({ source }) {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-black uppercase tracking-wide text-white">{source.name} Fields Mapped</h2>
        <span className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          {source.mapped}
        </span>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-white/10 md:grid-cols-2">
        {mappedFields.map(([from, to]) => (
          <div key={`${from}-${to}`} className="flex items-center justify-between gap-4 border-b border-r border-white/10 bg-cyan-950/20 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-bold text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              {from}
            </span>
            <span className="font-bold text-slate-400">{to}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
