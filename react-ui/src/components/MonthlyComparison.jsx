import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { BrainCircuit, CalendarRange, Download, FileSpreadsheet, Table2, UploadCloud } from "lucide-react";
import { AGE_BUCKETS, extractMonthFromFilename } from "../lib/vulnerabilityEngine.js";
import { downloadAnalysisWorkbook, downloadNormalizedCsv } from "../lib/reportExport.js";
import { loadBundledSamples } from "../data/sampleFiles.js";
import { AiReportBuilder } from "./AiReportBuilder.jsx";

const PRIORITY_COLORS = { P1: "#dc2626", P2: "#ea580c", P3: "#ca8a04", P4: "#16a34a" };
const SEVERITY_COLORS = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e", Info: "#0ea5e9", Unknown: "#64748b" };

export function MonthlyComparison({ analysis, onAnalyze, selectedSource, selectedMonth, onMonthChange }) {
  if (!analysis) return <MonthlyUploadGate selectedSource={selectedSource} onAnalyze={onAnalyze} />;

  const dashboard = analysis.dashboard;
  const monthOptions = dashboard.uploadedMonths;
  const open = dashboard.totalOpenVulnerabilities;
  const patched = dashboard.totalVulnerabilitiesPatchedLastMonth;
  const total = open.totalOpen || 1;
  const ageChartData = AGE_BUCKETS.map((bucket) => ({
    bucket: bucket.replace(" (6+ months)", ""),
    P1: dashboard.totalOpenByAgeAndPatchPriority.P1[bucket],
    P2: dashboard.totalOpenByAgeAndPatchPriority.P2[bucket],
    P3: dashboard.totalOpenByAgeAndPatchPriority.P3[bucket],
    P4: dashboard.totalOpenByAgeAndPatchPriority.P4[bucket],
  }));
  const priorityData = Object.entries(dashboard.totalOpenByPatchPriority).map(([priority, count]) => ({ priority, count, fill: PRIORITY_COLORS[priority] }));
  const severitySegments = Object.entries(dashboard.currentSeverityCounts)
    .filter(([, count]) => count > 0)
    .map(([label, value]) => ({ label, value, color: SEVERITY_COLORS[label], width: `${(value / total) * 100}%` }));

  const downloadExcel = async () => {
    await downloadAnalysisWorkbook(analysis);
  };

  return (
    <section className="rounded-[1.75rem] border border-cyan-300/15 bg-slate-950/80 p-5 shadow-cyber backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label text-emerald-300">Monthly Comparison Report</p>
          <h2 className="mt-1 text-2xl font-black text-white">{dashboard.reportRange}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">{analysis.sourceLabel} | {analysis.snapshots.length} validated monthly CSV exports</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={downloadExcel} className="ghost-button flex items-center gap-2 py-3">
            <Download className="h-4 w-4" />
            Download Excel Report
          </button>
          <button type="button" onClick={() => downloadNormalizedCsv(analysis)} className="ghost-button flex items-center gap-2 py-3">
            <Table2 className="h-4 w-4" />
            Normalized CSV
          </button>
          <a href="#ai-report-builder" className="neon-button flex items-center gap-2 py-3">
            <BrainCircuit className="h-4 w-4" />
            Generate Remediation PDF
          </a>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-cyan-300/15 bg-slate-900/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">
            {open.totalOpen.toLocaleString()} open | {open.newVulnerabilities.toLocaleString()} new | {patched.patchedCount.toLocaleString()} patched
          </p>
          <p className="text-xs font-bold text-slate-500">Current report severity distribution</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
          {severitySegments.map((segment) => <div key={segment.label} style={{ width: segment.width, backgroundColor: segment.color }} />)}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
          {severitySegments.map((segment) => (
            <span key={segment.label}><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />{segment.label} {segment.value}</span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total Open Vulnerabilities" value={open.totalOpen} helper={`${open.newVulnerabilities} new + ${open.notClosedFromPreviousMonths} not closed`} color="#14b8a6" />
        <Kpi label="Immediate Patch Needed" value={(dashboard.totalOpenByPatchPriority.P1 ?? 0) + (dashboard.totalOpenByPatchPriority.P2 ?? 0)} helper="P1 + P2" color="#ef4444" />
        <Kpi label="Patched Last Month" value={patched.patchedCount} helper={`${patched.previousMonth} to ${patched.currentMonth}`} color="#22c55e" />
        <Kpi label="Files Compared" value={analysis.snapshots.length} helper={dashboard.uploadedMonths.join(" | ")} color="#38bdf8" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ChartPanel number="1" title="Vulnerabilities Discovered - Last 3 Months" subtitle="New findings first observed in each uploaded month">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dashboard.trendDiscoveredLast3Months} margin={{ top: 12, right: 20, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey="discoveredCount" name="Discovered" type="monotone" stroke="#38bdf8" strokeWidth={3} dot={{ r: 5, fill: "#0f172a", strokeWidth: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel number="2" title="Total Open Vulnerabilities" subtitle="New findings plus findings not closed from the previous report">
          <div className="grid h-[260px] content-center gap-4 sm:grid-cols-3">
            <OpenMeasure label="Total Open" value={open.totalOpen} color="text-emerald-300" />
            <OpenMeasure label="New" value={open.newVulnerabilities} color="text-sky-300" />
            <OpenMeasure label="Not Closed" value={open.notClosedFromPreviousMonths} color="text-orange-300" />
          </div>
        </ChartPanel>

        <ChartPanel number="3" title="Total Open by Patch Priority" subtitle="Approved severity and exploit-availability matrix">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={priorityData} margin={{ top: 12, right: 18, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="priority" stroke="#64748b" />
              <YAxis allowDecimals={false} stroke="#64748b" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" name="Open findings" radius={[8, 8, 0, 0]} isAnimationActive={false}>
                {priorityData.map((entry) => <Cell key={entry.priority} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel number="4" title="Open Findings by Age and Patch Priority" subtitle="Cumulative >7, >30, >60, and >180 day thresholds">
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={ageChartData} margin={{ top: 12, right: 18, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bucket" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke="#64748b" />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }} />
              {Object.entries(PRIORITY_COLORS).map(([priority, color]) => <Bar key={priority} dataKey={priority} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false} />)}
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="mt-5">
        <ChartPanel number="5" title="Vulnerabilities Patched - Last 3 Months" subtitle="Findings present in one report and absent from the next">
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dashboard.trendRemediatedLast3Months} margin={{ top: 12, right: 20, bottom: 4, left: -8 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line dataKey="remediatedCount" name="Patched" type="monotone" stroke="#22c55e" strokeWidth={3} dot={{ r: 5, fill: "#0f172a", strokeWidth: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid content-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/8 p-5">
              <p className="mini-label">Latest Month Calculation</p>
              <p className="text-5xl font-black text-emerald-300">{patched.patchedCount}</p>
              <p className="text-sm font-semibold leading-6 text-slate-400">{patched.previousMonthOpen} previous open + {patched.newVulnerabilitiesIdentifiedThisMonth} new - {patched.currentMonthOpen} current open</p>
            </div>
          </div>
        </ChartPanel>
      </div>

      {dashboard.crowdstrikeInsights && <CrowdStrikeInsights insights={dashboard.crowdstrikeInsights} />}

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="mb-3 flex items-center gap-3"><FileSpreadsheet className="h-5 w-5 text-emerald-300" /><h3 className="font-black text-white">Uploaded Month Report</h3></div>
        <div className="overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr>{["Month", "Critical", "High", "Medium", "Low", "Total Open", "New", "Patched"].map((heading) => <th key={heading} className="border-b border-white/10 px-3 py-3 font-black">{heading}</th>)}</tr></thead>
            <tbody>{dashboard.severityTrend.map((row, index) => <tr key={row.month} className="border-b border-white/5 text-slate-300"><td className="px-3 py-3 font-bold text-white">{row.month}</td><td className="px-3 py-3 text-red-300">{row.Critical}</td><td className="px-3 py-3 text-orange-300">{row.High}</td><td className="px-3 py-3 text-yellow-200">{row.Medium}</td><td className="px-3 py-3 text-emerald-300">{row.Low}</td><td className="px-3 py-3 font-black text-white">{row.totalOpen}</td><td className="px-3 py-3 text-sky-300">{dashboard.openTrend[index].newThisMonth}</td><td className="px-3 py-3 text-emerald-300">{dashboard.openTrend[index].patchedSinceLastMonth}</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <div id="ai-report-builder" className="mt-5 grid gap-5 xl:grid-cols-[1fr_430px]">
        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <p className="mini-label">Report Outputs</p>
          <h3 className="mt-1 text-xl font-black text-white">Excel, normalized CSV, and Remediation Guide PDF</h3>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Excel and normalized CSV are generated from the local comparison. The selected month findings are sent only when you request an AI Remediation Guide.</p>
        </article>
        <AiReportBuilder analysis={analysis} selectedMonth={selectedMonth} onMonthChange={onMonthChange} monthOptions={monthOptions} workflow="monthly" />
      </div>
    </section>
  );
}

function MonthlyUploadGate({ selectedSource, onAnalyze }) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState({ state: "idle", message: "Select at least two monthly CSV exports." });
  const detectedMonths = files.map((file) => extractMonthFromFilename(file.name)?.label).filter(Boolean);
  const canAnalyze = files.length >= 2;

  const selectFiles = (fileList) => {
    const nextFiles = Array.from(fileList ?? []);
    const invalid = nextFiles.find((file) => !file.name.toLowerCase().endsWith(".csv"));
    if (invalid) {
      setStatus({ state: "error", message: `${invalid.name} is not a CSV file.` });
      return;
    }
    setFiles(nextFiles);
    setStatus({ state: nextFiles.length >= 2 ? "ready" : "error", message: nextFiles.length >= 2 ? `${nextFiles.length} monthly reports ready.` : "Select at least two monthly CSV exports." });
  };

  const analyze = async () => {
    if (!canAnalyze) return;
    setStatus({ state: "loading", message: `Comparing ${files.length} monthly reports locally...` });
    try {
      const result = await onAnalyze(files);
      setStatus({ state: "success", message: `${result.snapshots.length} reports analyzed.` });
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Monthly analysis failed." });
    }
  };

  const loadSamples = async () => {
    setStatus({ state: "loading", message: `Loading four real ${selectedSource.name} sample CSVs...` });
    try {
      const samples = await loadBundledSamples(selectedSource.id, "monthly");
      selectFiles(samples);
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Sample loading failed." });
    }
  };

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div><p className="mini-label">Monthly Data Comparison</p><h2 className="mt-1 text-2xl font-black text-white">Upload monthly exports</h2><p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Choose two or more {selectedSource.name} CSVs. Tenable.sc and Tenable.io can be mixed; CrowdStrike monthly comparison uses Vulnerabilities or Vulnerability per asset exports.</p></div>
        <span className={`rounded-full border px-4 py-2 text-sm font-bold ${canAnalyze ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-400"}`}>{files.length ? `${files.length} reports selected` : "No reports selected"}</span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div>
          <label className="group grid min-h-64 cursor-pointer place-items-center rounded-3xl border border-dashed border-white/20 bg-slate-950/50 p-8 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/5" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFiles(event.dataTransfer.files); }}>
            <input className="sr-only" type="file" accept=".csv,text/csv" multiple onChange={(event) => selectFiles(event.target.files)} />
            <UploadCloud className="mb-4 h-16 w-16 text-slate-300 transition group-hover:text-emerald-300" />
            <p className="text-lg font-black text-white">Drop all monthly CSVs here or click once to browse</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">Use filenames containing Month YYYY for reliable ordering.</p>
          </label>
          {files.length > 0 && <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4"><div className="flex flex-wrap gap-2">{files.map((file) => <span key={file.name} className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-100">{extractMonthFromFilename(file.name)?.label ?? file.name}</span>)}</div></div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={loadSamples} disabled={status.state === "loading"} className="ghost-button disabled:cursor-not-allowed disabled:opacity-45">Load 4-Month Test Pack</button>
            <button type="button" onClick={analyze} disabled={!canAnalyze || status.state === "loading"} className="neon-button disabled:cursor-not-allowed disabled:opacity-45">{status.state === "loading" ? "Analyzing Monthly Reports..." : "Analyze & Generate Monthly Report"}</button>
          </div>
          <p className={`mt-3 rounded-xl border px-4 py-3 text-xs font-bold ${status.state === "error" ? "border-red-300/25 bg-red-400/10 text-red-100" : "border-white/10 bg-white/5 text-slate-400"}`}>{status.message}</p>
        </div>
        <div className="grid gap-4">
          <Requirement title="2+ Monthly Reports" body="Calculates total open, new, not closed, and patched findings." />
          <Requirement title="3+ Monthly Reports" body="Builds the required three-month discovered and patched line charts." />
          <Requirement title="Auto Field Mapping" body={`${selectedSource.name} headers are detected and normalized before comparison.`} />
          {detectedMonths.length > 0 && <Requirement title="Detected Months" body={detectedMonths.join(" | ")} />}
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, helper, color }) {
  return <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"><p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-[-0.05em]" style={{ color }}>{Number(value).toLocaleString()}</p><p className="mt-1 truncate text-xs font-semibold text-slate-500" title={helper}>{helper}</p></article>;
}

function ChartPanel({ number, title, subtitle, children }) {
  return <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><div className="mb-3 flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 font-mono text-xs font-black text-emerald-300">{number}</span><div><h3 className="font-black text-white">{title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p></div></div>{children}</article>;
}

function OpenMeasure({ label, value, color }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 text-center"><p className={`text-4xl font-black ${color}`}>{Number(value).toLocaleString()}</p><p className="mt-2 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p></div>;
}

function CrowdStrikeInsights({ insights }) {
  return <section className="mt-5 rounded-2xl border border-red-300/15 bg-red-400/[0.035] p-5"><div className="mb-4"><p className="mini-label text-red-300">CrowdStrike Exposure Signals</p><h3 className="mt-1 text-xl font-black text-white">Prioritize exploitable and exposed assets</h3></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Kpi label="Exploit Available" value={insights.exploitAvailable} helper="Exploit status or CISA KEV" color="#fb923c" /><Kpi label="CISA KEV" value={insights.cisaKev} helper="Known exploited catalog" color="#ef4444" /><Kpi label="Internet Exposed" value={insights.internetExposed} helper="Open findings" color="#22d3ee" /><Kpi label="Critical Assets" value={insights.criticalAssets} helper="Distinct affected assets" color="#c084fc" /></div></section>;
}

function Requirement({ title, body }) {
  return <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-5"><div className="mb-3 flex items-center gap-3"><CalendarRange className="h-5 w-5 text-cyan-300" /><p className="font-black text-white">{title}</p></div><p className="text-sm font-semibold leading-6 text-slate-500">{body}</p></div>;
}

const tooltipStyle = { background: "#020617", border: "1px solid #1e293b", borderRadius: 12, color: "#e2e8f0" };
