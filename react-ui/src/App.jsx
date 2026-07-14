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
import { sourceTools } from "./data/dashboardData.js";
import { analyzeAdhocFiles, analyzeMonthlyFiles } from "./lib/vulnerabilityEngine.js";

export default function App() {
  const [selectedSourceId, setSelectedSourceId] = useState("tenable-sc");
  const [mode, setMode] = useState(null);
  const [adhocAnalysis, setAdhocAnalysis] = useState(null);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState(null);
  const [monthlyFiles, setMonthlyFiles] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  const selectedSource = useMemo(
    () => sourceTools.find((source) => source.id === selectedSourceId) ?? sourceTools[0],
    [selectedSourceId],
  );
  const focusMonthlyDashboard = mode === "monthly" && Boolean(monthlyAnalysis);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
  };

  const handleNavigation = (page) => {
    if (page === "dashboard") {
      setMode(null);
      return;
    }

    setMode(page);
  };

  const handleSourceChange = (sourceId) => {
    setSelectedSourceId(sourceId);
    setAdhocAnalysis(null);
    setMonthlyAnalysis(null);
    setMonthlyFiles([]);
    setSelectedMonth("");
  };

  const handleAdhocAnalyze = async (files) => {
    const result = await analyzeAdhocFiles(files, selectedSourceId);
    setAdhocAnalysis(result);
    setSelectedMonth(result.reportMonth);
    return result;
  };

  const handleMonthlyAnalyze = async (files) => {
    const result = await analyzeMonthlyFiles(files, selectedSourceId);
    setMonthlyFiles(Array.from(files ?? []));
    setMonthlyAnalysis(result);
    setSelectedMonth(result.dashboard.uploadedMonths.at(-1));
    return result;
  };

  const handleEditMonthlyUploads = () => {
    setMonthlyAnalysis(null);
    setSelectedMonth("");
  };

  const handleResetMonthlyUploads = () => {
    setMonthlyAnalysis(null);
    setMonthlyFiles([]);
    setSelectedMonth("");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_35%_10%,rgba(20,184,166,.18),transparent_30rem),radial-gradient(circle_at_85%_55%,rgba(245,158,11,.12),transparent_24rem)]" />
      <div className="relative z-10 flex">
        <Sidebar activePage={mode ?? "dashboard"} onNavigate={handleNavigation} />

        <main className="w-full min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1800px] flex-col gap-5">
            <HeroHeader />

            <div className={focusMonthlyDashboard ? "grid gap-5" : "grid gap-5 2xl:grid-cols-[1fr_390px]"}>
              <div className="flex min-w-0 flex-col gap-5">
                {!focusMonthlyDashboard && (
                  <>
                    <SourceChoice selectedSourceId={selectedSourceId} onSelect={handleSourceChange} />
                    <OperationMode mode={mode} onModeChange={handleModeChange} />
                  </>
                )}

                {!mode && <LandingHint selectedSource={selectedSource} />}

                {mode === "adhoc" && (
                  <>
                    <UploadPanel selectedSource={selectedSource} analysis={adhocAnalysis} onAnalyze={handleAdhocAnalyze} />

                    {adhocAnalysis ? (
                      <>
                        <MetricsRow dashboard={adhocAnalysis.dashboard} />
                        <TrendPanel dashboard={adhocAnalysis.dashboard} />
                        <div className="grid gap-5 xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[1.1fr_1fr]">
                          <FieldMappingPanel source={selectedSource} exportType={adhocAnalysis.exportType} />
                          <PriorityMatrix />
                        </div>
                        <RemediationQueue findings={adhocAnalysis.findings} />
                      </>
                    ) : (
                      <EmptyWorkflow />
                    )}
                  </>
                )}

                {mode === "monthly" && (
                  <MonthlyComparison
                    analysis={monthlyAnalysis}
                    onAnalyze={handleMonthlyAnalyze}
                    selectedSource={selectedSource}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    files={monthlyFiles}
                    onFilesChange={setMonthlyFiles}
                    onEditUploads={handleEditMonthlyUploads}
                    onResetUploads={handleResetMonthlyUploads}
                    onBackToDashboard={() => setMode(null)}
                  />
                )}
              </div>

              {!focusMonthlyDashboard && (
                <aside className="flex flex-col gap-5">
                  <StatusPanel
                    selectedSource={selectedSource}
                    mode={mode}
                    adhocUploaded={Boolean(adhocAnalysis)}
                    monthlyUploaded={Boolean(monthlyAnalysis)}
                  />
                  {mode !== "monthly" && (
                    <AiReportBuilder
                      selectedMonth={selectedMonth || "No month detected"}
                      onMonthChange={setSelectedMonth}
                      monthOptions={adhocAnalysis ? [adhocAnalysis.reportMonth] : ["No month detected"]}
                      analysis={adhocAnalysis}
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
          [ShieldCheck, "Exploit-aware priority", "Each supported scanner's exploit signal feeds the same approved P1-P4 matrix."],
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
        Once a CSV or XLSX is uploaded, MVA renders Total Open, Critical, High, Medium, Low, and Immediate Patch Needed with live trend sparklines.
      </p>
    </section>
  );
}

function StatusPanel({ selectedSource, mode, adhocUploaded, monthlyUploaded }) {
  const uploadState =
    mode === "monthly"
      ? monthlyUploaded
        ? "Monthly report analyzed"
        : "Waiting for monthly exports"
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
