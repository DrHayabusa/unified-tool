import { useState } from "react";
import { CloudUpload, LockKeyhole, Upload } from "lucide-react";

export function UploadPanel({ uploaded, onUpload }) {
  const [fileReady, setFileReady] = useState(false);

  const markFileReady = () => {
    setFileReady(true);
  };

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mini-label">Upload Export Files</p>
          <h2 className="mt-1 text-2xl font-black text-white">Adhoc file intake</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">Drag and drop export files or browse</p>
        </div>
        <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">
          CSV / XLSX
        </div>
      </div>

      <label className="group grid min-h-56 cursor-pointer place-items-center rounded-3xl border border-dashed border-white/20 bg-slate-950/50 p-8 text-center transition hover:border-emerald-300/45 hover:bg-emerald-400/5">
        <input className="sr-only" type="file" accept=".csv,.xlsx" onChange={markFileReady} />
        <CloudUpload className="mb-4 h-16 w-16 text-slate-300 transition group-hover:text-emerald-300" />
        <p className="text-lg font-black text-white">
          {uploaded ? "Analysis complete" : fileReady ? "File ready for analysis" : "Drop files here or click to browse"}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {uploaded ? "Adhoc dashboard generated locally" : "Maximum file size 500MB"}
        </p>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={fileReady ? onUpload : markFileReady}
          className={fileReady ? "neon-button flex items-center gap-2" : "ghost-button flex items-center gap-2"}
        >
          <Upload className="h-4 w-4" />
          {uploaded ? "Adhoc Dashboard Ready" : fileReady ? "Analyze & Generate Adhoc Dashboard" : "Use sample upload"}
        </button>
        <span className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200">
          All processing happens locally
        </span>
        <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-400">
          <LockKeyhole className="h-4 w-4 text-emerald-300" />
          Data never leaves this device until AI handoff
        </span>
      </div>
    </section>
  );
}
