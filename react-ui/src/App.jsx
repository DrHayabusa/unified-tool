import { useMemo, useState } from "react";
import { BrainCircuit, DatabaseZap, ShieldCheck } from "lucide-react";
import { AiReportBuilder } from "./components/AiReportBuilder.jsx";
import { FieldMappingPanel } from "./components/FieldMappingPanel.jsx";
import { HeroHeader } from "./components/HeroHeader.jsx";
import { MetricsRow } from "./components/MetricsRow.jsx";
import { MonthlyComparison } from "./components/MonthlyComparison.jsx";
import { OperationMode } from "./components/OperationMode.jsx";
import { PriorityMatrix } from "./components/PriorityMatrix.jsx";
import { QuarterlyTrendPanel } from "./components/QuarterlyTrendPanel.jsx";
import { RemediationQueue } from "./components/RemediationQueue.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { SourceChoice } from "./components/SourceChoice.jsx";
import { TrendPanel } from "./components/TrendPanel.jsx";
import { ThreatIntelPanel } from "./components/ThreatIntelPanel.jsx";
import { UploadPanel } from "./components/UploadPanel.jsx";
import { SourceCoveragePanel } from "./components/SourceCoveragePanel.jsx";
import { UnifiedAnalysisDashboard } from "./components/UnifiedAnalysisDashboard.jsx";
import { CustomerValueDashboards } from "./components/CustomerValueDashboards.jsx";
import { implementedSourceTools, sourceTools, unifiedSourceTool } from "./data/dashboardData.js";
import { analyzeAdhocFiles, analyzeMonthlyFiles, analyzeQuarterlyScan } from "./lib/vulnerabilityEngine.js";

export default function App() {
  const [sourceSelectionMode, setSourceSelectionMode] = useState("single");
  const [selectedSourceIds, setSelectedSourceIds] = useState(["tenable-sc"]);
  const [mode, setMode] = useState(null);
  const [adhocAnalysis, setAdhocAnalysis] = useState(null);
  const [adhocFiles, setAdhocFiles] = useState([]);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState(null);
  const [monthlyFiles, setMonthlyFiles] = useState([]);
  const [quarterlyAnalysis, setQuarterlyAnalysis] = useState(null);
  const [quarterlyFiles, setQuarterlyFiles] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const selectedSource = useMemo(
    () => sourceSelectionMode === "multi"
      ? { ...unifiedSourceTool, sourceIds: selectedSourceIds }
      : sourceTools.find((source) => source.id === selectedSourceIds[0]) ?? sourceTools[0],
    [selectedSourceIds, sourceSelectionMode],
  );
  const sourceSelection = useMemo(
    () => sourceSelectionMode === "multi" ? { mode: "multi", sourceIds: selectedSourceIds } : selectedSourceIds[0],
    [selectedSourceIds, sourceSelectionMode],
  );
  const unifiedSelectionReady = sourceSelectionMode !== "multi" || selectedSourceIds.length >= 2;
  const focusComparisonDashboard = mode === "monthly" && Boolean(monthlyAnalysis);
  const focusWorkspace = focusComparisonDashboard || mode === "threat-intel";

  const handleModeChange = (nextMode) => {
    if (!unifiedSelectionReady) return;
    setMode(nextMode);
  };

  const handleNavigation = (page) => {
    if (page === "dashboard") {
      handleBackToDashboard();
      return;
    }

    if (!unifiedSelectionReady) return;
    setMode(page);
  };

  const resetSourceWorkspace = () => {
    setAdhocAnalysis(null);
    setAdhocFiles([]);
    setMonthlyAnalysis(null);
    setMonthlyFiles([]);
    setQuarterlyAnalysis(null);
    setQuarterlyFiles([]);
    setSelectedMonth("");
    setLastAnalysis(null);
  };

  const handleSourceModeChange = (nextMode) => {
    if (nextMode === sourceSelectionMode) return;
    setSourceSelectionMode(nextMode);
    setSelectedSourceIds(nextMode === "multi" ? [] : [selectedSourceIds[0] ?? "tenable-sc"]);
    resetSourceWorkspace();
  };

  const handleSourceToggle = (sourceId) => {
    if (sourceSelectionMode === "single") {
      if (selectedSourceIds[0] === sourceId) return;
      setSelectedSourceIds([sourceId]);
      resetSourceWorkspace();
      return;
    }
    setSelectedSourceIds((current) => current.includes(sourceId) ? current.filter((id) => id !== sourceId) : [...current, sourceId]);
    resetSourceWorkspace();
  };

  const handleSelectAllSources = () => {
    setSelectedSourceIds(implementedSourceTools.map((source) => source.id));
    resetSourceWorkspace();
  };

  const handleClearSources = () => {
    setSelectedSourceIds([]);
    resetSourceWorkspace();
  };

  const handleAdhocAnalyze = async (files) => {
    const result = await analyzeAdhocFiles(files, sourceSelection);
    setAdhocFiles(Array.from(files ?? []));
    setAdhocAnalysis(result);
    setLastAnalysis(result);
    setSelectedMonth(result.reportMonth);
    return result;
  };

  const handleMonthlyAnalyze = async (files) => {
    const result = await analyzeMonthlyFiles(files, sourceSelection);
    setMonthlyFiles(Array.from(files ?? []));
    setMonthlyAnalysis(result);
    setLastAnalysis(result);
    setSelectedMonth(result.dashboard.uploadedMonths.at(-1));
    return result;
  };

  const handleQuarterlyAnalyze = async (files) => {
    const result = await analyzeQuarterlyScan(files, sourceSelection);
    setQuarterlyFiles(Array.from(files ?? []));
    setQuarterlyAnalysis(result);
    setLastAnalysis(result);
    setSelectedMonth(result.reportPeriod);
    return result;
  };

  const handleAdhocFilesChange = (nextFiles) => {
    setAdhocFiles((currentFiles) => typeof nextFiles === "function" ? nextFiles(currentFiles) : nextFiles);
    setAdhocAnalysis(null);
    setSelectedMonth("");
  };

  const handleQuarterlyFilesChange = (nextFiles) => {
    setQuarterlyFiles((currentFiles) => typeof nextFiles === "function" ? nextFiles(currentFiles) : nextFiles);
    setQuarterlyAnalysis(null);
    setSelectedMonth("");
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

  const handleBackToDashboard = () => {
    setMode(null);
    setAdhocAnalysis(null);
    setAdhocFiles([]);
    setMonthlyAnalysis(null);
    setMonthlyFiles([]);
    setQuarterlyAnalysis(null);
    setQuarterlyFiles([]);
    setSelectedMonth("");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_35%_10%,rgba(185,28,28,.14),transparent_30rem),radial-gradient(circle_at_85%_55%,rgba(127,29,29,.1),transparent_24rem)]" />
      <div className="relative z-10 flex">
        <Sidebar activePage={mode ?? "dashboard"} onNavigate={handleNavigation} />

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1800px] flex-col gap-5">
            <HeroHeader />

            <div className={focusWorkspace ? "grid gap-5" : "grid gap-5 2xl:grid-cols-[1fr_390px]"}>
              <div className="flex min-w-0 flex-col gap-5">
                {!focusWorkspace && (
                  <>
                    <SourceChoice
                      selectionMode={sourceSelectionMode}
                      selectedSourceIds={selectedSourceIds}
                      onModeChange={handleSourceModeChange}
                      onToggle={handleSourceToggle}
                      onSelectAll={handleSelectAllSources}
                      onClear={handleClearSources}
                    />
                    <OperationMode
                      mode={mode}
                      onModeChange={handleModeChange}
                      disabled={!unifiedSelectionReady}
                      disabledMessage="Select at least two source tools before choosing a unified workflow."
                    />
                  </>
                )}

                {!mode && <LandingHint selectedSource={selectedSource} />}

                {mode === "adhoc" && (
                  <>
                    <UploadPanel selectedSource={selectedSource} analysis={adhocAnalysis} files={adhocFiles} onFilesChange={handleAdhocFilesChange} onAnalyze={handleAdhocAnalyze} onBackToDashboard={handleBackToDashboard} />

                    {adhocAnalysis ? (
                      <>
                        <MetricsRow dashboard={adhocAnalysis.dashboard} />
                        <UnifiedAnalysisDashboard dashboard={adhocAnalysis.dashboard} />
                        <SourceCoveragePanel dashboard={adhocAnalysis.dashboard} inputSummary={adhocAnalysis.inputSummary} />
                        <CustomerValueDashboards analysis={adhocAnalysis} />
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
                    onBackToDashboard={handleBackToDashboard}
                    cadence="monthly"
                  />
                )}

                {mode === "quarterly" && (
                  <>
                    <UploadPanel selectedSource={selectedSource} analysis={quarterlyAnalysis} files={quarterlyFiles} onFilesChange={handleQuarterlyFilesChange} onAnalyze={handleQuarterlyAnalyze} onBackToDashboard={handleBackToDashboard} workflow="quarterly-scan" />
                    {quarterlyAnalysis ? (
                      <>
                        <MetricsRow dashboard={quarterlyAnalysis.dashboard} />
                        <UnifiedAnalysisDashboard dashboard={quarterlyAnalysis.dashboard} />
                        <SourceCoveragePanel dashboard={quarterlyAnalysis.dashboard} inputSummary={quarterlyAnalysis.inputSummary} />
                        <CustomerValueDashboards analysis={quarterlyAnalysis} />
                        <QuarterlyTrendPanel dashboard={quarterlyAnalysis.dashboard} />
                        <TrendPanel dashboard={quarterlyAnalysis.dashboard} />
                        <div className="grid gap-5 xl:grid-cols-[1fr_1fr] 2xl:grid-cols-[1.1fr_1fr]">
                          <FieldMappingPanel source={selectedSource} exportType={quarterlyAnalysis.exportType} />
                          <PriorityMatrix />
                        </div>
                        <RemediationQueue findings={quarterlyAnalysis.findings} />
                      </>
                    ) : (
                      <EmptyQuarterlyWorkflow unified={selectedSource.id === "unified"} />
                    )}
                  </>
                )}

                {mode === "threat-intel" && (
                  <ThreatIntelPanel analysis={lastAnalysis} onBackToDashboard={handleBackToDashboard} />
                )}
              </div>

              {!focusWorkspace && (
                <aside className="flex flex-col gap-5">
                  {!mode && <PriorityMatrix compact />}
                  <StatusPanel
                    selectedSource={selectedSource}
                    mode={mode}
                    adhocUploaded={Boolean(adhocAnalysis)}
                    monthlyUploaded={Boolean(monthlyAnalysis)}
                    quarterlyUploaded={Boolean(quarterlyAnalysis)}
                  />
                  {mode !== "monthly" && (
                    <AiReportBuilder
                      selectedMonth={selectedMonth || "No period detected"}
                      onMonthChange={setSelectedMonth}
                      monthOptions={(mode === "quarterly" ? quarterlyAnalysis : adhocAnalysis) ? [mode === "quarterly" ? quarterlyAnalysis.reportPeriod : adhocAnalysis.reportMonth] : ["No period detected"]}
                      analysis={mode === "quarterly" ? quarterlyAnalysis : adhocAnalysis}
                      workflow={mode === "quarterly" ? "quarterly-scan" : "adhoc"}
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
          [BrainCircuit, "AI PDF generation", "Prioritized findings can be sent through the secure MVA relay to your selected NVIDIA model for the approved Remediation Guide format."],
        ].map(([Icon, title, body]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <Icon className="mb-4 h-8 w-8 text-red-300" />
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
    <section className="rounded-[1.75rem] border border-dashed border-red-300/20 bg-slate-950/50 p-8 text-center">
      <p className="mini-label">Waiting for data</p>
      <h2 className="mt-2 text-2xl font-black text-white">Upload an export to unlock Adhoc metrics</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
        Once a CSV or XLSX is uploaded, MVA renders Total Open, Critical, High, Medium, Low, and Immediate Patch Needed with live trend sparklines.
      </p>
    </section>
  );
}

function EmptyQuarterlyWorkflow({ unified = false }) {
  return (
    <section className="rounded-[1.75rem] border border-dashed border-red-300/20 bg-slate-950/50 p-8 text-center">
      <p className="mini-label">Waiting for quarterly scan data</p>
      <h2 className="mt-2 text-2xl font-black text-white">{unified ? "Upload one current export per selected scanner" : "Upload one current scan export"}</h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
        {unified ? "MVA will consolidate the current scanner exports, retain source provenance, and chart vulnerabilities first discovered during the latest three months." : "MVA will summarize all open findings and build a line chart for vulnerabilities first discovered in the export's latest three months."}
      </p>
    </section>
  );
}

function StatusPanel({ selectedSource, mode, adhocUploaded, monthlyUploaded, quarterlyUploaded }) {
  const uploadState =
    mode === "monthly"
      ? monthlyUploaded
        ? "Monthly report analyzed"
        : "Waiting for monthly exports"
      : mode === "quarterly"
        ? quarterlyUploaded
          ? "Quarterly report analyzed"
          : selectedSource.id === "unified" ? "Waiting for current scanner exports" : "Waiting for one quarterly scan export"
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
          ["Operation Mode", mode ? (mode === "adhoc" ? "Adhoc Scan" : mode === "quarterly" ? "Quarterly Analysis" : "Monthly Data Comparison") : "Not selected"],
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
