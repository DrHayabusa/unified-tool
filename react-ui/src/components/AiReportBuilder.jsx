import { useState } from "react";
import { AlertTriangle, Bot, ChevronDown, FileText, ServerCog, Wifi } from "lucide-react";

const providers = [
  {
    name: "Local AI Server",
    helper: "Recommended for production. Keeps keys on your internal server.",
    model: "Internal MVA PDF agent",
    healthUrl: "http://127.0.0.1:8000/health",
  },
  {
    name: "NVIDIA NIM",
    helper: "Use through backend only. Do not expose NVIDIA_API_KEY in browser code.",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    healthUrl: "http://127.0.0.1:8000/health/nvidia",
  },
  {
    name: "Groq",
    helper: "Optional backend provider route.",
    model: "Backend configured model",
    healthUrl: "http://127.0.0.1:8000/health/groq",
  },
  {
    name: "OpenRouter",
    helper: "Optional backend provider route.",
    model: "Backend configured model",
    healthUrl: "http://127.0.0.1:8000/health/openrouter",
  },
  {
    name: "Template Only",
    helper: "Generate without AI provider calls.",
    model: "No external model",
    healthUrl: "",
  },
];

export function AiReportBuilder({ selectedMonth, onMonthChange, monthOptions = [], compact = false, workflow = "adhoc" }) {
  const [selectedProvider, setSelectedProvider] = useState(providers[0].name);
  const provider = providers.find((item) => item.name === selectedProvider) ?? providers[0];
  const [healthUrl, setHealthUrl] = useState(provider.healthUrl);
  const [connectionState, setConnectionState] = useState({ status: "idle", message: "Not tested yet" });
  const [reportState, setReportState] = useState({ status: "idle", message: "No report request sent yet" });
  const hasMonths = monthOptions.length > 0 && !monthOptions.includes("No month detected");
  const targetMonth = selectedMonth || (hasMonths ? monthOptions[monthOptions.length - 1] : "");
  const isMonthly = workflow === "monthly";

  const handleProviderChange = (event) => {
    const nextProvider = providers.find((item) => item.name === event.target.value) ?? providers[0];
    setSelectedProvider(nextProvider.name);
    setHealthUrl(nextProvider.healthUrl);
    setConnectionState({ status: "idle", message: "Not tested yet" });
    setReportState({ status: "idle", message: "No report request sent yet" });
  };

  const testConnectivity = async () => {
    if (!healthUrl) {
      setConnectionState({ status: "warn", message: "Template mode does not require an API server." });
      return;
    }

    setConnectionState({ status: "testing", message: "Testing API server..." });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
      });

      setConnectionState({
        status: response.ok ? "success" : "error",
        message: response.ok ? `Connected: ${response.status}` : `Server responded with ${response.status}`,
      });
    } catch (error) {
      setConnectionState({
        status: "error",
        message: "Could not reach API server. Check URL, CORS, VPN, and whether the backend is running.",
      });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const generateReport = async () => {
    if (!targetMonth) {
      setReportState({ status: "error", message: "Select or detect a PDF target month first." });
      return;
    }

    if (!healthUrl) {
      setReportState({ status: "success", message: `Template report request prepared for ${targetMonth}.` });
      return;
    }

    setReportState({ status: "testing", message: "Sending PDF generation request to API server..." });

    try {
      const generateUrl = new URL(healthUrl);
      generateUrl.pathname = "/generate/pdf";
      generateUrl.search = "";

      const response = await fetch(generateUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          model: provider.model,
          targetMonth,
          workflow,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      setReportState({
        status: response.ok ? "success" : "error",
        message: response.ok
          ? payload.message || `PDF generation request accepted for ${targetMonth}.`
          : payload.error || `PDF request failed with ${response.status}.`,
      });
    } catch (error) {
      setReportState({
        status: "error",
        message: "Could not reach PDF generation endpoint. Start the local API server first.",
      });
    }
  };

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
        <Bot className="h-8 w-8 text-emerald-300" />
        <div>
          <p className="mini-label">AI Report Builder</p>
          <h2 className="text-xl font-black text-white">Remediation Guide PDF</h2>
        </div>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">Select AI Provider</span>
          <div className="relative">
            <select
              value={selectedProvider}
              onChange={handleProviderChange}
              className="w-full appearance-none rounded-2xl border border-emerald-400/45 bg-slate-950/80 px-4 py-4 font-bold text-slate-100 outline-none"
            >
              {providers.map((provider) => (
                <option key={provider.name}>{provider.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            Model route: <span className="text-cyan-200">{provider.model}</span>
          </p>
        </label>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-black text-white">
            <ServerCog className="h-4 w-4 text-cyan-300" />
            AI generation request
          </p>
          <p className="text-sm font-semibold leading-6 text-slate-400">
            {isMonthly
              ? "Select the PDF target month, test backend connectivity, then generate the Remediation Guide through the AI server."
              : "After upload, use the selected AI provider or local AI server to generate the Remediation Guide PDF."}
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">PDF Target Month</span>
          <div className="relative">
            <select
              value={targetMonth}
              onChange={(event) => onMonthChange(event.target.value)}
              disabled={!hasMonths}
              className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-bold text-slate-100 outline-none"
            >
              {hasMonths ? (
                monthOptions.map((month) => <option key={month}>{month}</option>)
              ) : (
                <option value="">No month detected yet</option>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">API Server Health URL</span>
          <input
            value={healthUrl}
            onChange={(event) => setHealthUrl(event.target.value)}
            placeholder="https://your-mva-api.example.com/health"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none"
          />
        </label>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            API keys must stay on the backend or in local `.env`. Do not hard-code provider keys into this public GitHub Pages frontend.
          </p>
        </div>

        {!compact && (
          <div className="grid gap-3">
            {providers.slice(0, 3).map((provider, index) => (
              <div key={provider.name} className="flex items-center gap-3">
                <span className={`h-4 w-4 rounded-full border ${index === 0 ? "border-emerald-400 bg-emerald-400/80" : "border-slate-500"}`} />
                <div>
                  <p className="font-bold text-slate-200">{provider.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{provider.helper}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={testConnectivity} className="ghost-button flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            Test API Connectivity
          </button>
          <button type="button" onClick={generateReport} className="neon-button flex items-center justify-center gap-2">
            <FileText className="h-4 w-4" />
            Generate AI PDF Report
          </button>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-bold ${
            connectionState.status === "success"
              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
              : connectionState.status === "error"
                ? "border-red-300/30 bg-red-400/10 text-red-200"
                : connectionState.status === "testing"
                  ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.035] text-slate-400"
          }`}
        >
          API status: {connectionState.message}
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-bold ${
            reportState.status === "success"
              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
              : reportState.status === "error"
                ? "border-red-300/30 bg-red-400/10 text-red-200"
                : reportState.status === "testing"
                  ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.035] text-slate-400"
          }`}
        >
          PDF status: {reportState.message}
        </div>
      </div>
    </section>
  );
}
