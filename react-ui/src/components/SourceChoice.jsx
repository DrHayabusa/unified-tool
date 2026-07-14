import { CheckCircle2, Layers3, ScanLine } from "lucide-react";
import { SourceToolIcon } from "./ToolIcons.jsx";
import { sourceTools } from "../data/dashboardData.js";

export function SourceChoice({ selectionMode = "single", selectedSourceIds = [], onModeChange, onToggle }) {
  const unified = selectionMode === "multi";
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label">Step 01</p>
          <h2 className="mt-1 text-2xl font-black text-white">Source Choice</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">Analyze one scanner or consolidate multiple scanner exports</p>
        </div>
        <div className="inline-flex rounded-2xl border border-white/10 bg-black/30 p-1.5">
          <ModeButton active={!unified} icon={ScanLine} label="Single Tool" onClick={() => onModeChange?.("single")} />
          <ModeButton active={unified} icon={Layers3} label="Unified Multi-Tool" onClick={() => onModeChange?.("multi")} />
        </div>
      </div>

      <div className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${unified ? "border-red-300/25 bg-red-400/[0.07]" : "border-white/10 bg-white/[0.025]"}`}>
        <div>
          <p className="text-sm font-black text-white">{unified ? "Cross-scanner consolidation enabled" : "Source-specific analysis enabled"}</p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {unified
              ? "Select two or more tools. Files are detected independently, normalized, and deduplicated with source provenance retained."
              : "Select one tool for its established Adhoc, monthly, or quarterly workflow."}
          </p>
        </div>
        <span className="rounded-full border border-red-300/20 bg-black/25 px-3 py-2 text-xs font-black text-red-100">
          {unified ? `${selectedSourceIds.length} tools selected` : "Auto field mapping"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {sourceTools.map((tool) => {
          const isSelected = selectedSourceIds.includes(tool.id);
          const minimumSelection = unified && isSelected && selectedSourceIds.length <= 2;

          return (
            <button
              key={tool.id}
              type="button"
              disabled={!tool.implemented}
              aria-pressed={isSelected}
              title={minimumSelection ? "Unified mode requires at least two selected tools" : undefined}
              onClick={() => onToggle?.(tool.id)}
              className={`group relative min-h-44 rounded-2xl border p-4 text-left transition duration-200 ${
                isSelected
                  ? "border-red-400/60 bg-red-500/[0.07]"
                  : tool.implemented
                    ? "border-white/10 bg-slate-900/55 hover:border-red-300/30 hover:bg-slate-900/80"
                    : "cursor-not-allowed border-white/5 bg-slate-950/35 opacity-45"
              }`}
            >
              {isSelected && <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-red-300" />}
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

function ModeButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${active ? "bg-red-600 text-white shadow-[0_0_24px_rgba(220,38,38,.2)]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
