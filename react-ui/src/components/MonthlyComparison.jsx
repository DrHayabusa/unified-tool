import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";
import { BrainCircuit, CalendarRange, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import {
  monthlyDashboardMetrics,
  monthlyDashboardRows,
  monthlyOpenTrend,
  monthlySeverityTrend,
} from "../data/dashboardData.js";
import { AiReportBuilder } from "./AiReportBuilder.jsx";

const severitySegments = [
  { label: "Critical", value: 31, color: "bg-red-500", width: "24.8%" },
  { label: "High", value: 31, color: "bg-orange-400", width: "24.8%" },
  { label: "Medium", value: 31, color: "bg-yellow-300", width: "24.8%" },
  { label: "Low", value: 32, color: "bg-emerald-400", width: "25.6%" },
];

const tabs = ["Trends", "Priority & Aging", "Remediated", "Assets", "Queue", "Explorer"];

const tenableMonthlyApproaches = {
  "tenable-sc": [
    {
      id: "sc-only",
      title: "Tenable.sc multi-month",
      badge: "SC only",
      body: "Upload two or more Tenable.sc monthly exports when the customer stayed on Security Center for the full period.",
      example: "April SC + May SC + June SC + July SC",
    },
    {
      id: "mixed-sc-io",
      title: "SC to IO migration compare",
      badge: "Mixed SC + IO",
      body: "Upload monthly exports across both formats when older months are SC and newer months are IO. MVA normalizes both before comparing.",
      example: "April SC + May SC + June IO + July IO",
    },
  ],
  "tenable-io": [
    {
      id: "io-only",
      title: "Tenable.io multi-month",
      badge: "IO only",
      body: "Upload two or more Tenable.io monthly exports when all reporting months came from Vulnerability Management.",
      example: "April IO + May IO + June IO + July IO",
    },
    {
      id: "mixed-sc-io",
      title: "IO with historical SC",
      badge: "Mixed SC + IO",
      body: "Use this when the current month is IO but prior baseline months came from Security Center. Finding keys are normalized across both.",
      example: "May SC + June IO + July IO",
    },
  ],
};

const defaultMonthlyApproaches = [
  {
    id: "same-source",
    title: "Same-source multi-month",
    badge: "2+ months",
    body: "Upload two or more monthly exports from the selected scanner. MVA sorts months and compares the latest two for patched/new/open logic.",
    example: "April + May + June + July",
  },
  {
    id: "migration",
    title: "Migration / mixed export compare",
    badge: "Auto detect",
    body: "Use when month files come from different export formats that map into the same normalized MVA schema.",
    example: "Older source + newer source",
  },
];

export function MonthlyComparison({ uploaded, onUpload, selectedSource, selectedMonth, onMonthChange, monthOptions }) {
  if (!uploaded) {
    return <MonthlyUploadGate onUpload={onUpload} selectedSource={selectedSource} />;
  }

  return (
    <section className="rounded-[1.75rem] border border-cyan-300/15 bg-slate-950/80 p-5 shadow-cyber backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label text-emerald-300">Monthly Comparison Dashboard</p>
          <h2 className="mt-1 text-2xl font-black text-white">April 2026 - July 2026</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Multi-month CSV comparison: open, new, patched, priority, aging, and trend movement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">PDF Month</span>
            <select
              value={selectedMonth}
              onChange={(event) => onMonthChange(event.target.value)}
              className="bg-transparent py-1 text-sm font-bold text-slate-200 outline-none"
            >
              {monthOptions.map((month) => (
                <option key={month}>{month}</option>
              ))}
            </select>
          </label>
          <button type="button" className="ghost-button flex items-center gap-2 py-3">
            <Download className="h-4 w-4" />
            Download Excel
          </button>
          <button type="button" className="neon-button flex items-center gap-2 py-3">
            <BrainCircuit className="h-4 w-4" />
            Generate AI Remediation PDF
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-cyan-300/15 bg-slate-900/70 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            OK: 4 reports, 125 open in July 2026, 30 new, 25 patched
          </p>
          <p className="text-xs font-bold text-slate-500">Severity distribution</p>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-slate-800">
          {severitySegments.map((segment) => (
            <div key={segment.label} className={segment.color} style={{ width: segment.width }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-400">
          {severitySegments.map((segment) => (
            <span key={segment.label}>
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${segment.color}`} />
              {segment.label} {segment.value}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {monthlyDashboardMetrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em]" style={{ color: metric.color }}>
              {metric.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{metric.helper}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_420px]">
        <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="mb-4 flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-emerald-300" />
            <div>
              <p className="mini-label">Generated Report Outputs</p>
              <h3 className="text-xl font-black text-white">Excel dashboard + AI remediation guide</h3>
            </div>
          </div>
          <p className="max-w-4xl text-sm font-semibold leading-6 text-slate-400">
            The monthly workflow creates the Excel dashboard from local CSV comparison first. After selecting the target month, the normalized findings can be sent to the selected AI provider or local AI server to generate the Remediation Guide PDF.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
              <p className="font-black text-emerald-200">Excel report</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Monthly trends, open counts, patch priority, age buckets, and patched-last-month logic.</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
              <p className="font-black text-cyan-200">AI PDF report</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Target-month remediation guide generated through the selected AI server route.</p>
            </div>
          </div>
        </article>

        <AiReportBuilder selectedMonth={selectedMonth} onMonthChange={onMonthChange} monthOptions={monthOptions} workflow="monthly" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-white/10">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            className={`px-3 py-3 text-xs font-bold transition ${
              index === 0 ? "border-b-2 border-emerald-400 text-emerald-300" : "text-slate-500 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Severity Trend">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySeverityTrend} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: "rgba(15, 23, 42, 0.65)" }} contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }} />
              <Bar dataKey="Critical" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="High" fill="#fb923c" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Medium" fill="#fde047" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="Low" fill="#34d399" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Total Open Trend">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyOpenTrend} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid #1e293b" }} />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }} />
              <Line dataKey="totalOpen" name="Total Open" type="monotone" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
              <Line dataKey="newThisMonth" name="New This Month" type="monotone" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
              <Line
                dataKey="patchedSinceLastMonth"
                name="Patched Since Last Month"
                type="monotone"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <div className="mb-3 flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-emerald-300" />
          <h3 className="font-black text-white">Severity Trend - Uploaded Months</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {["Month", "Critical", "High", "Medium", "Low", "Total Open", "Period"].map((heading) => (
                  <th key={heading} className="border-b border-white/10 px-3 py-3 font-black">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyDashboardRows.map((row) => (
                <tr key={row.month} className="border-b border-white/5 text-slate-300">
                  <td className="px-3 py-3 font-bold text-slate-100">{row.month}</td>
                  <td className="px-3 py-3 text-red-300">{row.critical}</td>
                  <td className="px-3 py-3 text-orange-300">{row.high}</td>
                  <td className="px-3 py-3 text-yellow-200">{row.medium}</td>
                  <td className="px-3 py-3 text-emerald-300">{row.low}</td>
                  <td className="px-3 py-3 font-black text-white">{row.totalOpen}</td>
                  <td className="px-3 py-3 text-slate-500">{row.period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ChartPanel({ title, children }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <h3 className="mb-3 font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-300">{title}</h3>
      {children}
    </article>
  );
}

function MonthlyUploadGate({ onUpload, selectedSource }) {
  const [filesReady, setFilesReady] = useState(false);
  const [fileCount, setFileCount] = useState(0);
  const approaches = tenableMonthlyApproaches[selectedSource?.id] ?? defaultMonthlyApproaches;
  const [selectedApproach, setSelectedApproach] = useState(approaches[0]?.id ?? "same-source");
  const isTenable = selectedSource?.id === "tenable-sc" || selectedSource?.id === "tenable-io";
  const sourceName = selectedSource?.name ?? "Selected source";

  useEffect(() => {
    setSelectedApproach(approaches[0]?.id ?? "same-source");
  }, [approaches, selectedSource?.id]);

  const markFilesReady = (event) => {
    const nextFileCount = event?.target?.files?.length ?? 4;
    setFileCount(nextFileCount);
    setFilesReady(true);
  };

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label">Monthly Data Comparison</p>
          <h2 className="mt-1 text-2xl font-black text-white">Upload monthly exports first</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
            Upload at least two monthly exports. For Tenable.sc and Tenable.io, you can either analyze one source across many months or mix SC and IO month files during a migration.
          </p>
        </div>
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-200">
          {filesReady ? `${fileCount || 4} month files ready` : "No month detected yet"}
        </span>
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        {approaches.map((approach) => {
          const isSelected = approach.id === selectedApproach;

          return (
            <button
              key={approach.id}
              type="button"
              onClick={() => setSelectedApproach(approach.id)}
              className={`rounded-3xl border p-5 text-left transition ${
                isSelected
                  ? "border-emerald-300/60 bg-emerald-400/12 shadow-glow"
                  : "border-white/10 bg-slate-950/55 hover:border-cyan-300/35 hover:bg-cyan-300/8"
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-white">{approach.title}</h3>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-200">
                  {approach.badge}
                </span>
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-400">{approach.body}</p>
              <p className="mt-4 font-mono text-xs font-bold text-cyan-200">{approach.example}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
        <div>
          <label className="group grid min-h-60 cursor-pointer place-items-center rounded-3xl border border-dashed border-white/20 bg-slate-950/50 p-8 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/5">
            <input className="sr-only" type="file" accept=".csv,.xlsx" multiple onChange={markFilesReady} />
            <UploadCloud className="mb-4 h-16 w-16 text-slate-300 transition group-hover:text-emerald-300" />
            <p className="text-lg font-black text-white">
              {filesReady ? "Monthly files ready for analysis" : `Drop ${sourceName} monthly CSV/XLSX files here`}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {filesReady
                ? "Click Analyze to generate the dashboard and Excel report"
                : isTenable
                  ? "Supports SC-only, IO-only, or mixed SC + IO monthly exports"
                  : "Example: April + May + June + July"}
            </p>
          </label>
          <button
            type="button"
            onClick={filesReady ? onUpload : markFilesReady}
            className={filesReady ? "neon-button mt-4 w-full" : "ghost-button mt-4 w-full"}
          >
            {filesReady ? "Analyze & Generate Excel Report" : "Use sample multi-month files"}
          </button>
        </div>

        <div className="grid gap-4">
          {[
            ["Minimum 2 Month Exports", "Required for new, not closed, and patched calculations"],
            ["3+ Month Exports", "Used to build the vulnerability discovery trend and remediated trend"],
            ["Auto Format Detection", isTenable ? "SC and IO files can be mixed month-by-month and normalized before comparison" : "Monthly files are normalized into the MVA schema before comparison"],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-slate-950/55 p-5">
              <div className="mb-3 flex items-center gap-3">
                <CalendarRange className="h-5 w-5 text-cyan-300" />
                <p className="font-black text-white">{title}</p>
              </div>
              <p className="text-sm font-semibold leading-6 text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
