import { DatabaseZap, Files, Layers3, ScanSearch, ShieldCheck } from "lucide-react";

const SOURCE_TONES = {
  "tenable-sc": "border-emerald-300/20 bg-emerald-400/[0.07] text-emerald-200",
  "tenable-io": "border-sky-300/20 bg-sky-400/[0.07] text-sky-200",
  qualys: "border-red-300/20 bg-red-400/[0.07] text-red-200",
  crowdstrike: "border-orange-300/20 bg-orange-400/[0.07] text-orange-200",
};

export function SourceCoveragePanel({ dashboard, inputSummary }) {
  const sources = dashboard?.sourceBreakdown ?? [];
  const unified = (inputSummary?.sourceCount ?? sources.length) > 1;
  const historical = (dashboard?.sourceTrend?.length ?? 0) > 1;
  if (!unified) return null;

  const metrics = [
    [Files, historical ? "Current Period Files" : "Input Files", inputSummary?.fileCount ?? 0],
    [Layers3, "Scanner Sources", inputSummary?.sourceCount ?? sources.length],
    [ScanSearch, historical ? "Current Observations" : "Source Observations", inputSummary?.normalizedObservations ?? 0],
    [ShieldCheck, historical ? "Current Open" : "Consolidated Open", inputSummary?.consolidatedOpenFindings ?? dashboard?.totalVulnerabilities ?? dashboard?.totalOpenVulnerabilities?.totalOpen ?? 0],
    [DatabaseZap, historical ? "Current Repeats Removed" : "Repeats Removed", inputSummary?.duplicatesRemoved ?? 0],
  ];

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label">Unified Analysis Audit</p>
          <h2 className="mt-1 text-xl font-black text-white">Cross-scanner source coverage</h2>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-slate-400">
            Total Open is deduplicated by asset, vulnerability, and service. Source cards show where each consolidated finding was observed, so their counts can overlap across scanners.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-200">Source provenance retained</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map(([Icon, label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <Icon className="h-5 w-5 text-red-300" />
            <p className="mt-4 text-2xl font-black text-white">{Number(value).toLocaleString()}</p>
            <p className="mt-1 text-[0.65rem] font-black uppercase tracking-[0.13em] text-slate-500">{label}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sources.map((source) => (
          <article key={source.sourceId} className={`rounded-2xl border p-4 ${SOURCE_TONES[source.sourceId] ?? "border-white/10 bg-white/[0.03] text-slate-200"}`}>
            <p className="text-xs font-black uppercase tracking-[0.13em]">{source.sourceLabel}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <SourceMeasure label="Findings" value={source.openFindings} />
              <SourceMeasure label="Assets" value={source.affectedAssets} />
              <SourceMeasure label="Exploit" value={source.exploitAvailable} />
            </div>
          </article>
        ))}
      </div>

      {historical && (
        <div className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-black/30 uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Period</th><th className="px-4 py-3">Files</th><th className="px-4 py-3">Sources</th><th className="px-4 py-3">Repeats Removed</th></tr>
            </thead>
            <tbody>
              {dashboard.sourceTrend.map((row) => (
                <tr key={row.period} className="border-t border-white/5 text-slate-300">
                  <td className="px-4 py-3 font-black text-white">{row.period}</td>
                  <td className="px-4 py-3">{row.fileCount}</td>
                  <td className="px-4 py-3">{row.sources.map((source) => source.sourceLabel).join(" + ")}</td>
                  <td className="px-4 py-3 font-black text-red-200">{row.duplicatesRemoved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SourceMeasure({ label, value }) {
  return <div><p className="text-xl font-black text-white">{Number(value ?? 0).toLocaleString()}</p><p className="mt-1 text-[0.58rem] font-black uppercase tracking-wide opacity-60">{label}</p></div>;
}
