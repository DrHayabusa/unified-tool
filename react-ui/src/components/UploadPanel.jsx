import { useState } from "react";
import { CheckCircle2, CloudUpload, FileSearch, LockKeyhole, Upload } from "lucide-react";
import { loadBundledSamples } from "../data/sampleFiles.js";

export function UploadPanel({ selectedSource, analysis, onAnalyze }) {
  const [file, setFile] = useState(null);
  const [sampleVariant, setSampleVariant] = useState("vulnerability-per-asset");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const selectFile = (nextFile) => {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith(".csv")) {
      setStatus({ state: "error", message: "Select a CSV export. XLSX input is not enabled in this browser release." });
      return;
    }
    setFile(nextFile);
    setStatus({ state: "ready", message: `${nextFile.name} is ready for local analysis.` });
  };

  const runAnalysis = async () => {
    if (!file || status.state === "loading") return;
    setStatus({ state: "loading", message: `Reading and normalizing ${file.name}...` });
    try {
      const result = await onAnalyze?.([file]);
      setStatus({
        state: "success",
        message: `${result?.sourceLabel ?? selectedSource.name} detected. ${result?.dashboard?.totalVulnerabilities?.toLocaleString() ?? 0} open findings analyzed.`,
      });
    } catch (error) {
      setStatus({ state: "error", message: error.message || "Analysis failed." });
    }
  };

  const loadSample = async () => {
    setStatus({ state: "loading", message: "Loading the bundled test CSV..." });
    try {
      const [sample] = await loadBundledSamples(selectedSource.id, "adhoc", sampleVariant);
      selectFile(sample);
    } catch (error) {
      setStatus({ state: "error", message: error.message });
    }
  };

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label">Upload Export File</p>
          <h2 className="mt-1 text-2xl font-black text-white">Adhoc file intake</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">
            Analyze one {selectedSource.name} CSV with automatic export-type detection.
          </p>
        </div>
        <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">CSV up to 500MB</div>
      </div>

      <label
        className="group grid min-h-56 cursor-pointer place-items-center rounded-3xl border border-dashed border-white/20 bg-slate-950/50 p-8 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/5"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          selectFile(event.dataTransfer.files?.[0]);
        }}
      >
        <input className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0])} />
        {analysis ? (
          <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-300" />
        ) : (
          <CloudUpload className="mb-4 h-16 w-16 text-slate-300 transition group-hover:text-emerald-300" />
        )}
        <p className="text-lg font-black text-white">
          {analysis ? "Analysis complete" : file ? file.name : "Drop one CSV here or click once to browse"}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {analysis ? `${analysis.exportType} detected automatically` : file ? formatBytes(file.size) : "The file remains in this browser until an optional AI handoff."}
        </p>
      </label>

      {selectedSource.id === "crowdstrike" && (
        <label className="mt-4 block rounded-2xl border border-red-300/15 bg-red-400/5 p-4">
          <span className="mb-2 block text-xs font-black uppercase tracking-wide text-red-200">CrowdStrike sample export type</span>
          <select value={sampleVariant} onChange={(event) => setSampleVariant(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-3 text-sm font-bold text-slate-200 outline-none">
            <option value="vulnerabilities">Vulnerabilities</option>
            <option value="vulnerability-per-asset">Vulnerability per asset</option>
            <option value="remediation-per-assets">Remediation per assets</option>
          </select>
        </label>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[auto_auto_1fr]">
        <button type="button" onClick={loadSample} disabled={status.state === "loading"} className="ghost-button flex items-center justify-center gap-2 disabled:opacity-45">
          Load Real Sample CSV
        </button>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={!file || status.state === "loading"}
          className="neon-button flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status.state === "loading" ? <FileSearch className="h-4 w-4 animate-pulse" /> : <Upload className="h-4 w-4" />}
          {status.state === "loading" ? "Analyzing CSV..." : analysis ? "Re-analyze Selected CSV" : "Analyze & Generate Dashboard"}
        </button>
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-bold ${
            status.state === "error"
              ? "border-red-300/25 bg-red-400/10 text-red-100"
              : status.state === "success"
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-400"
          }`}
        >
          {status.message || "Select a CSV to begin."}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <span className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200">Local CSV comparison</span>
        <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400">
          <LockKeyhole className="h-4 w-4 text-emerald-300" />
          Data leaves the browser only when you request an AI report
        </span>
      </div>
    </section>
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
