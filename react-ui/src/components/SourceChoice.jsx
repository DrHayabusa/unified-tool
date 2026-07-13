import { CheckCircle2 } from "lucide-react";
import { SourceToolIcon } from "./ToolIcons.jsx";
import { sourceTools } from "../data/dashboardData.js";

export function SourceChoice({ selectedSourceId, onSelect }) {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label">Step 01</p>
          <h2 className="mt-1 text-2xl font-black text-white">Source Choice</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">Select the source of your vulnerability data</p>
        </div>
        <div className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
          Auto field mapping enabled
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {sourceTools.map((tool) => {
          const isSelected = tool.id === selectedSourceId;

          return (
            <button
              key={tool.id}
              type="button"
              disabled={!tool.implemented}
              onClick={() => onSelect(tool.id)}
              className={`group relative min-h-44 rounded-2xl border p-4 text-left transition duration-200 ${
                isSelected
                  ? "border-emerald-400/70 bg-emerald-400/12 shadow-glow"
                  : tool.implemented
                    ? "border-white/10 bg-slate-900/55 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-cyan-300/8"
                    : "cursor-not-allowed border-white/5 bg-slate-950/35 opacity-45"
              }`}
            >
              {isSelected && <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-emerald-300" />}
              {!tool.implemented && <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-slate-900 px-2 py-1 text-[0.6rem] font-black uppercase tracking-wide text-slate-400">Next</span>}
              <div className="mb-4 flex justify-center">
                <SourceToolIcon id={tool.id} accent={tool.accent} />
              </div>
              <p className="text-center text-lg font-black text-white">{tool.name}</p>
              <p className="mt-1 text-center text-xs font-semibold text-slate-500">{tool.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
