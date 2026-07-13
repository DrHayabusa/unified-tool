import { useState } from "react";
import { AlertTriangle, Bot, ChevronDown, FileText, KeyRound, Wifi } from "lucide-react";
import { buildRemediationPrompt, buildTemplateMarkdown, downloadRemediationPdf } from "../lib/pdfReport.js";

const providers = [
  {
    name: "NVIDIA Nemotron 3 Ultra",
    helper: "Strongest open NVIDIA model for long-context reasoning and customer remediation writing.",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    type: "nvidia",
    badge: "Recommended - strongest",
  },
  {
    name: "NVIDIA Nemotron 3 Super",
    helper: "Balanced quality, latency, and agentic reasoning.",
    model: "nvidia/nemotron-3-super-120b-a12b",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    type: "nvidia",
    badge: "Balanced",
  },
  {
    name: "NVIDIA Nemotron 3 Nano",
    helper: "Fast, lower-latency report drafting for routine workloads.",
    model: "nvidia/nemotron-3-nano-30b-a3b",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    type: "nvidia",
    badge: "Fast",
  },
  {
    name: "MVA Cloud API",
    helper: "Your organization-hosted API keeps provider credentials server-side.",
    model: "mva-remediation-agent",
    baseUrl: "",
    type: "backend",
    badge: "Enterprise",
  },
  {
    name: "Template PDF - No AI",
    helper: "Build the approved Remediation Guide locally without an external model.",
    model: "No external model",
    baseUrl: "",
    type: "template",
    badge: "Always available",
  },
];

export function AiReportBuilder({ analysis, selectedMonth, onMonthChange, monthOptions = [], compact = false, workflow = "adhoc" }) {
  const [selectedProvider, setSelectedProvider] = useState(providers[0].name);
  const provider = providers.find((item) => item.name === selectedProvider) ?? providers[0];
  const [sessionApiKey, setSessionApiKey] = useState("");
  const [providerBaseUrl, setProviderBaseUrl] = useState(provider.baseUrl);
  const [providerModel, setProviderModel] = useState(provider.model);
  const [connectionState, setConnectionState] = useState({ status: "idle", message: "Not tested yet" });
  const [reportState, setReportState] = useState({ status: "idle", message: "No report generated yet" });
  const hasMonths = monthOptions.length > 0 && !monthOptions.includes("No month detected");
  const targetMonth = selectedMonth || (hasMonths ? monthOptions.at(-1) : "");

  const handleProviderChange = (event) => {
    const next = providers.find((item) => item.name === event.target.value) ?? providers[0];
    setSelectedProvider(next.name);
    setProviderBaseUrl(next.baseUrl);
    setProviderModel(next.model);
    setConnectionState({ status: "idle", message: "Not tested yet" });
    setReportState({ status: "idle", message: "No report generated yet" });
  };

  const testConnectivity = async () => {
    if (provider.type === "template") {
      setConnectionState({ status: "success", message: "Template PDF mode is ready and does not require an API key." });
      return;
    }
    if (!providerBaseUrl.trim()) {
      setConnectionState({ status: "error", message: "Enter the cloud provider or MVA Cloud API base URL." });
      return;
    }
    if (provider.type === "nvidia" && !sessionApiKey.trim()) {
      setConnectionState({ status: "error", message: "Paste an NVIDIA API key for this browser session." });
      return;
    }

    setConnectionState({ status: "testing", message: "Testing the cloud model route..." });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    try {
      if (provider.type === "nvidia") {
        const payload = await callNvidia({
          baseUrl: providerBaseUrl,
          apiKey: sessionApiKey,
          model: providerModel,
          messages: [{ role: "user", content: "Reply with exactly: MVA READY" }],
          maxTokens: 12,
          signal: controller.signal,
          thinking: false,
        });
        const answer = payload.choices?.[0]?.message?.content?.trim() || "Connected";
        setConnectionState({ status: "success", message: `Connected to ${providerModel}: ${answer}` });
      } else {
        const response = await fetch(joinUrl(providerBaseUrl, "/health"), {
          headers: sessionApiKey ? { Authorization: `Bearer ${sessionApiKey}` } : undefined,
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Cloud API returned HTTP ${response.status}.`);
        setConnectionState({ status: "success", message: "MVA Cloud API is reachable." });
      }
    } catch (error) {
      setConnectionState({
        status: "error",
        message: error.name === "AbortError" ? "Connection test timed out after 45 seconds." : friendlyProviderError(error),
      });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const generateReport = async () => {
    if (!analysis) {
      setReportState({ status: "error", message: "Analyze an upload before generating the PDF." });
      return;
    }
    if (!targetMonth) {
      setReportState({ status: "error", message: "Select the PDF target month first." });
      return;
    }
    if (provider.type !== "template" && !providerBaseUrl.trim()) {
      setReportState({ status: "error", message: "Enter the cloud API base URL." });
      return;
    }
    if (provider.type === "nvidia" && !sessionApiKey.trim()) {
      setReportState({ status: "error", message: "Paste an NVIDIA API key for this browser session." });
      return;
    }

    setReportState({ status: "testing", message: "Generating the Remediation Guide..." });
    try {
      let markdown;
      if (provider.type === "template") {
        markdown = buildTemplateMarkdown({ analysis, targetMonth });
      } else if (provider.type === "nvidia") {
        const result = await callNvidia({
          baseUrl: providerBaseUrl,
          apiKey: sessionApiKey,
          model: providerModel,
          messages: [
            { role: "system", content: "You are the MVA Remediation Guide engine. Return clean customer-ready Markdown only." },
            { role: "user", content: buildRemediationPrompt({ analysis, targetMonth }) },
          ],
          maxTokens: 8192,
          thinking: true,
        });
        markdown = result.choices?.[0]?.message?.content?.trim();
        if (!markdown) throw new Error("The NVIDIA model returned no report content.");
      } else {
        const response = await fetch(joinUrl(providerBaseUrl, "/generate/pdf"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionApiKey ? { Authorization: `Bearer ${sessionApiKey}` } : {}),
          },
          body: JSON.stringify({
            targetMonth,
            workflow,
            sourceTool: analysis.sourceLabel,
            dashboardSummary: analysis.dashboard,
            findings: prioritizedPayload(analysis, targetMonth),
          }),
        });
        if (!response.ok) throw new Error(`MVA Cloud API returned HTTP ${response.status}.`);
        if (response.headers.get("content-type")?.includes("application/pdf")) {
          const blob = await response.blob();
          savePdfBlob(blob, `MVA_${targetMonth.replaceAll(" ", "_")}_Remediation_Guide.pdf`);
          setReportState({ status: "success", message: `Remediation Guide PDF downloaded for ${targetMonth}.` });
          return;
        }
        const payload = await response.json();
        markdown = payload.aiMarkdown || payload.markdown;
        if (!markdown) throw new Error("MVA Cloud API did not return PDF content or report Markdown.");
      }

      await downloadRemediationPdf({ markdown, sourceLabel: analysis.sourceLabel, targetMonth });
      setReportState({ status: "success", message: `Remediation Guide PDF downloaded for ${targetMonth}.` });
    } catch (error) {
      setReportState({ status: "error", message: friendlyProviderError(error) });
    }
  };

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
        <Bot className="h-8 w-8 text-emerald-300" />
        <div><p className="mini-label">AI Report Builder</p><h2 className="text-xl font-black text-white">Remediation Guide PDF</h2></div>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">AI Provider / Model</span>
          <div className="relative">
            <select value={selectedProvider} onChange={handleProviderChange} className="w-full appearance-none rounded-2xl border border-emerald-400/45 bg-slate-950/80 px-4 py-4 font-bold text-slate-100 outline-none">
              {providers.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold leading-5 text-slate-500">
            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-cyan-200">{provider.badge}</span>
            <span>{provider.helper}</span>
          </div>
        </label>

        {provider.type !== "template" && (
          <div className="grid gap-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/5 p-4">
            <div><p className="text-sm font-black text-white">Cloud session settings</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Values stay in browser memory and are cleared when this tab closes. Nothing is saved to GitHub.</p></div>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400"><KeyRound className="h-4 w-4" />API Key (session only)</span><input type="password" value={sessionApiKey} onChange={(event) => setSessionApiKey(event.target.value)} placeholder={provider.type === "nvidia" ? "nvapi-..." : "Optional cloud API token"} autoComplete="off" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none" /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-400">Cloud Base URL</span><input value={providerBaseUrl} onChange={(event) => setProviderBaseUrl(event.target.value)} placeholder={provider.type === "nvidia" ? "https://integrate.api.nvidia.com/v1" : "https://mva-api.your-org.example"} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none" /></label>
            <label className="block"><span className="mb-2 block text-sm font-bold text-slate-400">Model Route</span><input value={providerModel} onChange={(event) => setProviderModel(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none" /></label>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">PDF Target Month</span>
          <div className="relative">
            <select value={targetMonth} onChange={(event) => onMonthChange(event.target.value)} disabled={!hasMonths} className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-bold text-slate-100 outline-none disabled:opacity-50">
              {hasMonths ? monthOptions.map((month) => <option key={month}>{month}</option>) : <option value="">No month detected yet</option>}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
        </label>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
          <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />NVIDIA Build is a trial cloud endpoint, not an unlimited production service. For enterprise deployment, route calls through your MVA Cloud API and keep keys server-side.</p>
        </div>

        {!compact && <p className="text-xs font-semibold leading-5 text-slate-500">Only the dashboard summary and the highest-priority normalized findings are included in the AI request. CSV comparison remains local.</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={testConnectivity} className="ghost-button flex items-center justify-center gap-2"><Wifi className="h-4 w-4" />Test Cloud Connection</button>
          <button type="button" onClick={generateReport} className="neon-button flex items-center justify-center gap-2"><FileText className="h-4 w-4" />Generate PDF Report</button>
        </div>

        <StatusBox label="API status" state={connectionState} />
        <StatusBox label="PDF status" state={reportState} />
      </div>
    </section>
  );
}

async function callNvidia({ baseUrl, apiKey, model, messages, maxTokens, signal, thinking }) {
  const response = await fetch(joinUrl(baseUrl, "/chat/completions"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey.trim()}` },
    body: JSON.stringify({
      model: model.trim(),
      messages,
      temperature: thinking ? 1 : 0,
      top_p: thinking ? 0.95 : 1,
      max_tokens: maxTokens,
      stream: false,
      ...(thinking ? { chat_template_kwargs: { enable_thinking: true }, reasoning_budget: 4096 } : {}),
    }),
    signal,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.detail || payload?.error?.message || payload?.message || `NVIDIA returned HTTP ${response.status}.`);
  return payload;
}

function prioritizedPayload(analysis, targetMonth) {
  const snapshot = analysis.workflow === "monthly" ? analysis.snapshots?.find((item) => item.month === targetMonth) : null;
  const findings = snapshot?.findings ?? (analysis.workflow === "monthly" ? analysis.currentFindings : analysis.findings);
  return [...findings]
    .sort((left, right) => ({ P1: 1, P2: 2, P3: 3, P4: 4 }[left.patchPriority] ?? 9) - ({ P1: 1, P2: 2, P3: 3, P4: 4 }[right.patchPriority] ?? 9) || right.assetExposure - left.assetExposure)
    .slice(0, 80);
}

function StatusBox({ label, state }) {
  const classes = state.status === "success" ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : state.status === "error" ? "border-red-300/30 bg-red-400/10 text-red-200" : state.status === "testing" ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.035] text-slate-400";
  return <div className={`rounded-2xl border px-4 py-3 text-xs font-bold ${classes}`}>{label}: {state.message}</div>;
}

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function friendlyProviderError(error) {
  const message = error?.message || "The cloud request failed.";
  if (/failed to fetch/i.test(message)) return "The browser could not reach the cloud endpoint. Check the URL, VPN, provider CORS policy, or use MVA Cloud API.";
  if (/401|unauthorized/i.test(message)) return "Unauthorized: generate a fresh API key and paste the complete nvapi- value for this session.";
  if (/429|rate/i.test(message)) return "The provider trial limit was reached. Wait and retry, choose a smaller model, or use MVA Cloud API.";
  return message;
}

function savePdfBlob(blob, name) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
