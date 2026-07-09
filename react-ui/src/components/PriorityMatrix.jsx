const rows = [
  ["Critical", "P1", "P2", "text-red-400"],
  ["High", "P1", "P2", "text-orange-400"],
  ["Medium", "P2", "P3", "text-yellow-300"],
  ["Low", "P2", "P4", "text-emerald-400"],
];

export function PriorityMatrix() {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <p className="mini-label">Priority Matrix</p>
      <h2 className="mt-1 text-xl font-black text-white">Exploit Availability vs Severity</h2>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        <div className="grid grid-cols-3 bg-slate-950/70 text-center text-xs font-black uppercase tracking-wide text-slate-400">
          <div className="p-3">Severity</div>
          <div className="border-l border-white/10 p-3">Yes / Available</div>
          <div className="border-l border-white/10 p-3">No / Unavailable</div>
        </div>
        {rows.map(([severity, yes, no, tone]) => (
          <div key={severity} className="grid grid-cols-3 border-t border-white/10 text-center font-black">
            <div className={`bg-white/[0.035] p-3 uppercase ${tone}`}>{severity}</div>
            <div className="border-l border-white/10 p-3 text-2xl text-red-400">{yes}</div>
            <div className="border-l border-white/10 p-3 text-2xl text-orange-400">{no}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          ["P1", "Immediate", "bg-red-500"],
          ["P2", "Priority", "bg-orange-500"],
          ["P3", "Planned", "bg-yellow-500"],
          ["P4", "Deferred", "bg-emerald-500"],
        ].map(([priority, label, color]) => (
          <div key={priority} className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-center">
            <span className={`inline-flex rounded-lg px-3 py-1 text-sm font-black text-white ${color}`}>{priority}</span>
            <p className="mt-2 text-xs font-bold text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
