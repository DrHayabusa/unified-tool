import { Filter, Search } from "lucide-react";
import { remediationRows } from "../data/dashboardData.js";

const severityClass = {
  Critical: "bg-red-500 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-400 text-slate-950",
  Low: "bg-emerald-500 text-slate-950",
};

const priorityClass = {
  P1: "bg-red-500 text-white",
  P2: "bg-orange-500 text-white",
  P3: "bg-yellow-400 text-slate-950",
  P4: "bg-emerald-500 text-slate-950",
};

export function RemediationQueue() {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mini-label">Remediation Queue</p>
          <h2 className="mt-1 text-2xl font-black text-white">
            Findings ready for guide generation <span className="text-base text-emerald-300">125 Findings</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="ghost-button flex items-center gap-2">
            Filter
            <Filter className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-500">Search...</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-white/[0.055] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              {["IP Address", "DNS Name", "Vulnerability Name", "CVE", "Severity", "Priority", "Exposure"].map((heading) => (
                <th key={heading} className="px-4 py-4 font-black">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {remediationRows.map((row) => (
              <tr key={`${row.ip}-${row.name}`} className="border-t border-white/10 bg-slate-950/35 text-slate-300">
                <td className="px-4 py-4 font-bold">{row.ip}</td>
                <td className="px-4 py-4 font-bold">{row.dns}</td>
                <td className="px-4 py-4 font-bold text-slate-100">{row.name}</td>
                <td className="px-4 py-4 font-mono text-xs font-bold">{row.cve}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${severityClass[row.severity]}`}>{row.severity}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${priorityClass[row.priority]}`}>
                    {row.priority}
                  </span>
                </td>
                <td className="px-4 py-4 font-black text-white">{row.exposure}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
