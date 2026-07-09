import { useState } from "react";
import { AlertTriangle, Bot, ChevronDown, FileText, ServerCog, Wifi } from "lucide-react";

const providers = [
  {
    name: "NVIDIA NIM",
    helper: "NVIDIA-hosted model through your MVA backend.",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    healthUrl: "",
    backendPath: "/health/nvidia",
    requiresBackend: true,
  },
  {
    name: "MVA Cloud API",
    helper: "Your internal backend keeps keys server-side.",
    model: "Internal MVA PDF agent",
    baseUrl: "",
    healthUrl: "",
    backendPath: "/health",
    requiresBackend: true,
  },
  {
    name: "Groq",
    helper: "Groq route through your MVA backend.",
    model: "Backend configured model",
    baseUrl: "",
    healthUrl: "",
    backendPath: "/health/groq",
    requiresBackend: true,
  },
  {
    name: "OpenRouter",
    helper: "Optional backend provider route.",
    model: "Backend configured model",
    baseUrl: "",
    healthUrl: "",
    backendPath: "/health/openrouter",
    requiresBackend: true,
  },
  {
    name: "Template Only",
    helper: "Generate without AI provider calls.",
    model: "No external model",
    baseUrl: "",
    healthUrl: "",
    backendPath: "",
    requiresBackend: false,
  },
];

const isTemplateProvider = (providerName) => providerName === "Template Only";

const backendUrlPlaceholder = (provider) =>
  provider.backendPath ? `https://your-mva-api.example.com${provider.backendPath}` : "https://your-mva-api.example.com/health";

export function AiReportBuilder({ selectedMonth, onMonthChange, monthOptions = [], compact = false, workflow = "adhoc" }) {
  const [selectedProvider, setSelectedProvider] = useState(providers[0].name);
  const provider = providers.find((item) => item.name === selectedProvider) ?? providers[0];
  const [healthUrl, setHealthUrl] = useState(provider.healthUrl);
  const [sessionApiKey, setSessionApiKey] = useState("");
  const [providerBaseUrl, setProviderBaseUrl] = useState(provider.baseUrl);
  const [providerModel, setProviderModel] = useState(provider.model);
  const [connectionState, setConnectionState] = useState({ status: "idle", message: "Not tested yet" });
  const [reportState, setReportState] = useState({ status: "idle", message: "No report request sent yet" });
  const hasMonths = monthOptions.length > 0 && !monthOptions.includes("No month detected");
  const targetMonth = selectedMonth || (hasMonths ? monthOptions[monthOptions.length - 1] : "");
  const isMonthly = workflow === "monthly";

  const handleProviderChange = (event) => {
    const nextProvider = providers.find((item) => item.name === event.target.value) ?? providers[0];
    setSelectedProvider(nextProvider.name);
    setHealthUrl(nextProvider.healthUrl);
    setProviderBaseUrl(nextProvider.baseUrl);
    setProviderModel(nextProvider.model);
    setConnectionState({ status: "idle", message: "Not tested yet" });
    setReportState({ status: "idle", message: "No report request sent yet" });
  };

  const testConnectivity = async () => {
    if (!healthUrl) {
      setConnectionState({
        status: isTemplateProvider(selectedProvider) ? "warn" : "error",
        message: isTemplateProvider(selectedProvider)
          ? "Template mode does not require an API server."
          : `Paste your MVA backend health URL, for example ${backendUrlPlaceholder(provider)}.`,
      });
      return;
    }

    setConnectionState({ status: "testing", message: "Testing API server..." });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);

    try {
      const hasSessionOverride = Boolean(sessionApiKey.trim() || providerBaseUrl.trim() || providerModel.trim() !== provider.model);
      const response = await fetch(healthUrl, {
        method: hasSessionOverride ? "POST" : "GET",
        headers: hasSessionOverride ? { "Content-Type": "application/json" } : undefined,
        body: hasSessionOverride
          ? JSON.stringify({
              provider: selectedProvider,
              apiKey: sessionApiKey.trim(),
              baseUrl: providerBaseUrl.trim(),
              model: providerModel.trim(),
            })
          : undefined,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));

      setConnectionState({
        status: response.ok ? "success" : "error",
        message: response.ok
          ? payload.response
            ? `Connected: ${payload.provider || selectedProvider} returned "${payload.response}".`
            : `Connected: ${response.status}`
          : payload.error || payload.message || `Server responded with ${response.status}`,
      });
    } catch (error) {
      const isAbort = error?.name === "AbortError";
      setConnectionState({
        status: "error",
        message: isAbort
          ? "API test timed out after 45 seconds. The server may be busy or the provider request is slow."
          : "Could not reach the MVA backend. Check the backend URL, CORS policy, VPN, and API gateway routing.",
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
      setReportState({
        status: isTemplateProvider(selectedProvider) ? "success" : "error",
        message: isTemplateProvider(selectedProvider)
          ? `Template report request prepared for ${targetMonth}.`
          : `Paste your MVA backend health URL before generating the PDF, for example ${backendUrlPlaceholder(provider)}.`,
      });
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
          model: providerModel,
          apiKey: sessionApiKey.trim(),
          baseUrl: providerBaseUrl.trim(),
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
        message: "Could not reach PDF generation endpoint. Check the deployed backend URL, CORS policy, VPN, and API gateway routing.",
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
            Model route: <span className="text-cyan-200">{providerModel}</span>
          </p>
        </label>

        <div className="grid gap-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4">
          <div>
            <p className="text-sm font-black text-white">Session provider settings</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
              Paste an API key or provider base URL here only for this session. The API server URL below must point to your MVA backend.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-400">API Key (session only)</span>
            <input
              type="password"
              value={sessionApiKey}
              onChange={(event) => setSessionApiKey(event.target.value)}
              placeholder="Paste provider API key for this browser session"
              autoComplete="off"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-400">Provider Base URL</span>
            <input
              value={providerBaseUrl}
              onChange={(event) => setProviderBaseUrl(event.target.value)}
              placeholder="https://integrate.api.nvidia.com/v1"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-400">Model</span>
            <input
              value={providerModel}
              onChange={(event) => setProviderModel(event.target.value)}
              placeholder="nvidia/nemotron-3-ultra-550b-a55b"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-black text-white">
            <ServerCog className="h-4 w-4 text-cyan-300" />
            AI generation request
          </p>
          <p className="text-sm font-semibold leading-6 text-slate-400">
            {isMonthly
              ? "Select the PDF target month, test backend connectivity, then generate the Remediation Guide through the AI server."
              : "After upload, use the selected AI provider through your MVA backend to generate the Remediation Guide PDF."}
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
            placeholder={backendUrlPlaceholder(provider)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none"
          />
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            This must be your deployed MVA backend endpoint, not the NVIDIA provider URL. The backend then calls NVIDIA securely.
          </p>
        </label>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Best practice: keep API keys on the backend. Session-pasted keys are for quick testing and are sent only to the configured MVA backend when you click test/generate.
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
