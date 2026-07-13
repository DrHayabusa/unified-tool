import { CheckCircle2 } from "lucide-react";

const mappings = {
  "tenable-sc": [
    ["IP Address", "IP Address"], ["DNS Name", "DNS Name"], ["Vulnerability Name", "Plugin Name"], ["CVE", "CVE"],
    ["Severity", "Severity / Risk Factor"], ["Exploit Availability", "Exploit?"], ["First Discovered", "First Discovered"], ["Remediation", "Steps to Remediate"],
  ],
  "tenable-io": [
    ["IP Address", "asset.display_ipv4_address"], ["DNS Name", "asset.display_fqdn"], ["Vulnerability Name", "definition.name"], ["CVE", "definition.cve"],
    ["Severity", "definition.severity"], ["Exploit Availability", "definition.exploitability_ease"], ["Vulnerability Age", "vuln_age / age_in_days"], ["Remediation", "definition.solution"],
  ],
  qualys: [
    ["IP Address", "IP"], ["DNS Name", "FQDN / DNS"], ["Vulnerability Name", "Title"], ["CVE", "CVE ID"],
    ["Severity", "Severity"], ["Exploit Availability", "Exploitability / Associated Malware"], ["First Discovered", "First Detected"], ["Remediation", "Solution"],
  ],
  crowdstrike: [
    ["IP Address", "LocalIP"], ["DNS Name", "Hostname"], ["Vulnerability Name", "CVE Description / RecommendedRemediation"], ["CVE", "CVE ID"],
    ["Severity", "Severity / Critical-High-Medium-Low counts"], ["Exploit Availability", "Exploit status label / Exploits / CISA KEV"], ["First Discovered", "Created Date"], ["Remediation", "Recommended Remediations / RemediationDetail"],
  ],
};

export function FieldMappingPanel({ source, exportType }) {
  const mappedFields = mappings[source.id] ?? [];
  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wide text-white">{source.name} Fields Mapped</h2>
          <p className="mt-1 text-xs font-bold text-cyan-200">Detected: {exportType}</p>
        </div>
        <span className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          {mappedFields.length} core mappings active
        </span>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-white/10 md:grid-cols-2">
        {mappedFields.map(([target, sourceField]) => (
          <div key={`${target}-${sourceField}`} className="flex items-center justify-between gap-4 border-b border-r border-white/10 bg-cyan-950/20 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-bold text-slate-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              {target}
            </span>
            <span className="max-w-[58%] text-right font-mono text-[0.7rem] font-bold text-slate-400">{sourceField}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
