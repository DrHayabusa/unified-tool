import { useMemo, useState } from "react";
import { BrainCircuit, DatabaseZap, ShieldCheck } from "lucide-react";
import { AiReportBuilder } from "./components/AiReportBuilder.jsx";
import { FieldMappingPanel } from "./components/FieldMappingPanel.jsx";
import { HeroHeader } from "./components/HeroHeader.jsx";
import { MetricsRow } from "./components/MetricsRow.jsx";
import { MonthlyComparison } from "./components/MonthlyComparison.jsx";
import { OperationMode } from "./components/OperationMode.jsx";
import { PriorityMatrix } from "./components/PriorityMatrix.jsx";
import { RemediationQueue } from "./components/RemediationQueue.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { SourceChoice } from "./components/SourceChoice.jsx";
import { TrendPanel } from "./components/TrendPanel.jsx";
import { UploadPanel } from "./components/UploadPanel.jsx";
import { monthOptions, sourceTools } from "./data/dashboardData.js";

export default function App() {
  const [selectedSourceId, setSelectedSourceId] = useState("tenable-sc");
  const [mode, setMode] = useState(null);
  const [adhocUploaded, setAdhocUploaded] = useState(false);
  const [monthlyUploaded, setMonthlyUploaded] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");

  const selectedSource = useMemo(
    () => sourceTools.find((source) => source.id === selectedSourceId) ?? sourceTools[0],
    [selectedSourceId],
  );
  const focusMonthlyDashboard = mode === "monthly" && monthlyUploaded;

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
  };

  const handleAdhocUpload = () => {
    setAdhocUploaded(true);
  };

  const handleMonthlyUpload = () => {
    setMonthlyUploaded(true);
    setSelectedMonth("July 2026");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_35%_10%,rgba(20,184,166,.18),transparent_30rem),radial-gradient(circle_at_85%_55%,rgba(245,158,11,.12),transparent_24rem)]" />
      <div className="relative z-10 flex">
        <Sidebar />

        <main className="w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1800px] flex-col gap-5">
            <HeroHeader />

            <div className={focusMonthlyDashboard ? "grid gap-5" : "grid gap-5 2xl:grid-cols-[1fr_390px]"}>
              <div className="flex min-w-0 flex-col gap-5">
                {!focusMonthlyDashboard && (
                  <>
                    <SourceChoice selectedSourceId={selectedSourceId} onSelect={setSelectedSourceId} />
                    <OperationMode mode={mode} onModeChange={handleModeChange} />
                  </>
                )}

                {!mode && <LandingHint selectedSource={selectedSource} />}

                {mode === "adhoc" && (
                  <>
                    <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
                      <UploadPanel uploaded={adhocUploaded} onUpload={handleAdhocUpload} />
                      <TrendPanel />
                    </div>

                    {adhocUploaded ? (
                      <>
                        <MetricsRow />
                        <div className="grid gap-5 xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[1.1fr_1fr]">
                          <FieldMappingPanel source={selectedSource} />
                          <PriorityMatrix />
                        </div>
                        <RemediationQueue />
                      </>
                    ) : (
                      <EmptyWorkflow />
                    )}
                  </>
                )}

                {mode === "monthly" && (
                  <MonthlyComparison
                    uploaded={monthlyUploaded}
                    onUpload={handleMonthlyUpload}
                    selectedSource={selectedSource}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    monthOptions={monthlyUploaded ? monthOptions : []}
                  />
                )}
              </div>

              {!focusMonthlyDashboard && (
                <aside className="flex flex-col gap-5">
                  <StatusPanel
                    selectedSource={selectedSource}
                    mode={mode}
                    adhocUploaded={adhocUploaded}
                    monthlyUploaded={monthlyUploaded}
                  />
                  {mode !== "monthly" && (
                    <AiReportBuilder
                      selectedMonth={selectedMonth || "No month detected"}
                      onMonthChange={setSelectedMonth}
                      monthOptions={monthlyUploaded ? monthOptions : ["No month detected"]}
                      compact
                    />
                  )}
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LandingHint({ selectedSource }) {
  return (
    <section className="cyber-panel rounded-[1.75rem] p-6">
      <div className="grid gap-5 lg:grid-cols-3">
        {[
          [DatabaseZap, "Source-aware dashboards", `${selectedSource.name} mapping is selected and ready.`],
          [ShieldCheck, "Exploit-aware priority", "SC Exploit? and IO Exploit Ease both feed the same priority matrix."],
          [BrainCircuit, "AI PDF generation", "Normalized rows can be sent to your AI server for the approved Remediation Guide format."],
        ].map(([Icon, title, body]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <Icon className="mb-4 h-8 w-8 text-cyan-300" />
            <h3 className="text-lg font-black text-white">{title}</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyWorkflow() {
  return (
    <section className="rounded-[1.75rem] border border-dashed border-cyan-300/20 bg-slate-950/50 p-8 text-center">
      <p className="mini-label">Waiting for data</p>
      <h2 className="mt-2 text-2xl font-black text-white">Upload an export to unlock Adhoc metrics</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
        Once a CSV/XLSX is uploaded, MVA renders Total Open, Critical, High, Medium, Low, and Immediate Patch Needed with live trend sparklines.
      </p>
    </section>
  );
}

function StatusPanel({ selectedSource, mode, adhocUploaded, monthlyUploaded }) {
  const uploadState =
    mode === "monthly"
      ? monthlyUploaded
        ? "Monthly report analyzed"
        : "Waiting for monthly CSVs"
      : adhocUploaded
        ? "Adhoc report analyzed"
        : "Waiting";

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <p className="mini-label">Session State</p>
      <h2 className="mt-1 text-xl font-black text-white">Current workflow</h2>

      <div className="mt-5 space-y-3">
        {[
          ["Source Tool", selectedSource.name],
          ["Operation Mode", mode ? (mode === "adhoc" ? "Adhoc Scan" : "Monthly Data Comparison") : "Not selected"],
          ["Upload State", uploadState],
          ["Output", "CSV / Excel / Remediation Guide PDF"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
            <span className="text-sm font-bold text-slate-500">{label}</span>
            <span className="text-right text-sm font-black text-slate-100">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
