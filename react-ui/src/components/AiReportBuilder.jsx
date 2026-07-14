import { useState } from "react";
import { AlertTriangle, Bot, CheckCircle2, ChevronDown, ExternalLink, FileText, KeyRound, LockKeyhole, Wifi } from "lucide-react";
import {
  AI_PROVIDERS,
  callOpenAiCompatible,
  completionText,
  joinUrl,
  providerById,
  validateProviderSettings,
} from "../lib/aiProviders.js";
import { buildRemediationPrompt, buildTemplateMarkdown, downloadRemediationPdf } from "../lib/pdfReport.js";

export function AiReportBuilder({ analysis, selectedMonth, onMonthChange, monthOptions = [], compact = false, workflow = "adhoc" }) {
  const [selectedProviderId, setSelectedProviderId] = useState(AI_PROVIDERS[0].id);
  const provider = providerById(selectedProviderId);
  const [sessionApiKey, setSessionApiKey] = useState("");
  const [providerBaseUrl, setProviderBaseUrl] = useState(provider.baseUrl);
  const [providerModel, setProviderModel] = useState(provider.model);
  const [connectionState, setConnectionState] = useState({ status: "idle", message: "Not tested yet" });
  const [reportState, setReportState] = useState({ status: "idle", message: "No report generated yet" });
  const hasMonths = monthOptions.length > 0 && !monthOptions.includes("No month detected");
  const targetMonth = selectedMonth || (hasMonths ? monthOptions.at(-1) : "");
  const connectionBusy = connectionState.status === "testing";
  const reportBusy = reportState.status === "testing";

  const handleProviderChange = (event) => {
    const next = providerById(event.target.value);
    setSelectedProviderId(next.id);
    setProviderBaseUrl(next.baseUrl);
    setProviderModel(next.model);
    setSessionApiKey("");
    setConnectionState({ status: "idle", message: "Not tested yet" });
    setReportState({ status: "idle", message: "No report generated yet" });
  };

  const testConnectivity = async () => {
    if (provider.type === "template") {
      setConnectionState({ status: "success", message: "Local template mode is ready. No API key or cloud connection is required." });
      return;
    }
    const validationError = validateProviderSettings({ provider, baseUrl: providerBaseUrl, apiKey: sessionApiKey, model: providerModel });
    if (validationError) {
      setConnectionState({ status: "error", message: validationError });
      return;
    }

    setConnectionState({ status: "testing", message: `Testing ${provider.name}...` });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    try {
      if (provider.type === "openai") {
        const payload = await callOpenAiCompatible({
          provider,
          baseUrl: providerBaseUrl,
          apiKey: sessionApiKey,
          model: providerModel,
          messages: [{ role: "user", content: "Reply with exactly: MVA READY" }],
          maxTokens: 16,
          signal: controller.signal,
        });
        const answer = completionText(payload, { allowReasoning: true }) || "Connected";
        setConnectionState({ status: "success", message: `Connected to ${providerModel}: ${answer.slice(0, 120)}` });
      } else if (provider.type === "nvidia-proxy") {
        const response = await fetch(joinUrl(providerBaseUrl, "/health/nvidia"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: sessionApiKey, baseUrl: provider.providerBaseUrl, model: providerModel }),
          signal: controller.signal,
        });
        await requireJsonSuccess(response, provider.name);
        setConnectionState({ status: "success", message: `MVA Cloud API reached NVIDIA model ${providerModel}.` });
      } else {
        const response = await fetch(joinUrl(providerBaseUrl, "/health"), {
          headers: sessionApiKey ? { Authorization: `Bearer ${sessionApiKey.trim()}` } : undefined,
          signal: controller.signal,
        });
        await requireJsonSuccess(response, provider.name);
        setConnectionState({ status: "success", message: "MVA Cloud API is reachable." });
      }
    } catch (error) {
      setConnectionState({
        status: "error",
        message: error.name === "AbortError" ? "Connection test timed out after 45 seconds." : friendlyProviderError(error, provider),
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
    if (!targetMonth || targetMonth === "No month detected") {
      setReportState({ status: "error", message: "Select the PDF target month first." });
      return;
    }
    const validationError = validateProviderSettings({ provider, baseUrl: providerBaseUrl, apiKey: sessionApiKey, model: providerModel });
    if (validationError) {
      setReportState({ status: "error", message: validationError });
      return;
    }

    setReportState({ status: "testing", message: `Generating the ${targetMonth} Remediation Guide...` });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 180_000);
    try {
      let markdown;
      if (provider.type === "template") {
        markdown = buildTemplateMarkdown({ analysis, targetMonth });
      } else if (provider.type === "openai") {
        const result = await callOpenAiCompatible({
          provider,
          baseUrl: providerBaseUrl,
          apiKey: sessionApiKey,
          model: providerModel,
          messages: [
            { role: "system", content: "You are the MVA Remediation Guide engine. Return clean customer-ready Markdown only. Never invent commands, versions, KB identifiers, CVEs, or links." },
            { role: "user", content: buildRemediationPrompt({ analysis, targetMonth }) },
          ],
          maxTokens: 8192,
          report: true,
          signal: controller.signal,
        });
        markdown = completionText(result);
        if (!markdown) throw new Error(`${provider.name} returned no final report content.`);
      } else {
        const response = await fetch(joinUrl(providerBaseUrl, "/generate/pdf"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(provider.type === "backend" && sessionApiKey ? { Authorization: `Bearer ${sessionApiKey.trim()}` } : {}),
          },
          body: JSON.stringify({
            provider: provider.name,
            targetMonth,
            workflow,
            sourceTool: analysis.sourceLabel,
            dashboardSummary: analysis.dashboard,
            findings: prioritizedPayload(analysis, targetMonth),
            reportPrompt: buildRemediationPrompt({ analysis, targetMonth }),
            model: providerModel,
            ...(provider.type === "nvidia-proxy" ? { apiKey: sessionApiKey, baseUrl: provider.providerBaseUrl } : {}),
          }),
          signal: controller.signal,
        });
        if (response.headers.get("content-type")?.includes("application/pdf")) {
          if (!response.ok) throw new Error(`${provider.name} returned HTTP ${response.status}.`);
          const blob = await response.blob();
          savePdfBlob(blob, `MVA_${targetMonth.replaceAll(" ", "_")}_Remediation_Guide.pdf`);
          setReportState({ status: "success", message: `Remediation Guide PDF downloaded for ${targetMonth}.` });
          return;
        }
        const payload = await requireJsonSuccess(response, provider.name);
        markdown = payload.aiMarkdown || payload.markdown;
        if (!markdown) throw new Error(`${provider.name} did not return PDF content or report Markdown.`);
      }

      await downloadRemediationPdf({ markdown, sourceLabel: analysis.sourceLabel, targetMonth });
      setReportState({ status: "success", message: `Remediation Guide PDF downloaded for ${targetMonth}.` });
    } catch (error) {
      setReportState({
        status: "error",
        message: error.name === "AbortError" ? "Report generation timed out after 3 minutes. Retry or choose Template PDF." : friendlyProviderError(error, provider),
      });
    } finally {
      window.clearTimeout(timeout);
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
            <select value={selectedProviderId} onChange={handleProviderChange} className="w-full appearance-none rounded-2xl border border-emerald-400/45 bg-slate-950/80 px-4 py-4 pr-11 font-bold text-slate-100 outline-none">
              {AI_PROVIDERS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-black text-white">Cloud session settings</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-400">Values stay in browser memory, are never added to exports, and clear when this tab closes.</p></div>
              {provider.keyUrl && <a href={provider.keyUrl} target="_blank" rel="noreferrer" className="shrink-0 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-black text-emerald-200 hover:border-emerald-300/50">Generate key <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a>}
            </div>
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400"><KeyRound className="h-4 w-4" />{provider.keyLabel}{!provider.requiresKey && " (optional)"}</span>
              <input type="password" value={sessionApiKey} onChange={(event) => setSessionApiKey(event.target.value)} placeholder={provider.keyPlaceholder} autoComplete="off" spellCheck="false" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-400">{provider.type === "openai" ? "Provider Base URL" : "MVA Cloud API URL"}</span>
              <input value={providerBaseUrl} onChange={(event) => setProviderBaseUrl(event.target.value)} placeholder={provider.type === "openai" ? provider.baseUrl : "https://mva-api.your-org.example"} inputMode="url" spellCheck="false" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-400">Model Route</span>
              <input value={providerModel} onChange={(event) => setProviderModel(event.target.value)} disabled={provider.type === "backend"} spellCheck="false" className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-xs font-bold text-slate-100 outline-none disabled:cursor-not-allowed disabled:opacity-60" />
            </label>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-400">PDF Target Month</span>
          <div className="relative">
            <select value={targetMonth} onChange={(event) => onMonthChange?.(event.target.value)} disabled={!hasMonths} className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 pr-11 font-bold text-slate-100 outline-none disabled:opacity-50">
              {hasMonths ? monthOptions.map((month) => <option key={month}>{month}</option>) : <option value="">No month detected yet</option>}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          </div>
        </label>

        <ProviderNotice provider={provider} />

        {!compact && <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />CSV/XLSX parsing, month comparison, priority scoring, and dashboards stay local. An AI request contains only the selected dashboard summary and up to 80 prioritized normalized findings.</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={testConnectivity} disabled={connectionBusy || reportBusy} className="ghost-button flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-50"><Wifi className="h-4 w-4" />{connectionBusy ? "Testing..." : "Test Provider"}</button>
          <button type="button" onClick={generateReport} disabled={connectionBusy || reportBusy} className="neon-button flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-50"><FileText className="h-4 w-4" />{reportBusy ? "Generating..." : "Generate PDF Report"}</button>
        </div>

        <StatusBox label="API status" state={connectionState} />
        <StatusBox label="PDF status" state={reportState} />
      </div>
    </section>
  );
}

function ProviderNotice({ provider }) {
  if (provider.type === "template") {
    return <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4"><p className="flex items-start gap-2 text-xs font-semibold leading-5 text-emerald-100"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />No vulnerability data leaves this browser. The approved local report template remains available even when every cloud provider is offline.</p></div>;
  }
  if (provider.type === "nvidia-proxy") {
    return <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4"><p className="flex items-start gap-2 text-xs font-semibold leading-5 text-amber-100"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />NVIDIA Build blocks direct browser requests. Enter your deployed HTTPS MVA Cloud API URL here; do not enter the NVIDIA provider URL in that field.</p></div>;
  }
  if (provider.type === "backend") {
    return <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4"><p className="flex items-start gap-2 text-xs font-semibold leading-5 text-emerald-100"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />Enterprise mode sends the report request only to your MVA Cloud API. AI provider credentials remain in your organization&apos;s backend secret store.</p></div>;
  }
  return <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4"><p className="flex items-start gap-2 text-xs font-semibold leading-5 text-cyan-100"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />This direct-cloud mode is intended for session testing. For enterprise rollout, use MVA Cloud API so long-lived provider keys remain server-side.</p></div>;
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
  return <div aria-live="polite" className={`rounded-2xl border px-4 py-3 text-xs font-bold ${classes}`}>{label}: {state.message}</div>;
}

async function requireJsonSuccess(response, providerName) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.error || payload?.detail || payload?.message || `${providerName} returned HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function friendlyProviderError(error, provider) {
  const message = error?.message || "The cloud request failed.";
  if (/failed to fetch/i.test(message)) {
    return provider.type === "nvidia-proxy"
      ? "The browser could not reach your MVA Cloud API. Confirm its public HTTPS URL, CORS policy, and deployment status."
      : `The browser could not reach ${provider.name}. Check the URL, VPN, browser policy, and provider availability.`;
  }
  if (error?.status === 401 || /401|unauthorized|invalid api key/i.test(message)) return `Unauthorized: generate a fresh ${provider.keyLabel || "API key"} and paste the complete value for this session.`;
  if (error?.status === 402 || /insufficient credits/i.test(message)) return "The provider account has insufficient credits. Add credit or select a free model route.";
  if (error?.status === 403 || /forbidden/i.test(message)) return "The provider rejected this model or key permission. Verify model access and account policy.";
  if (error?.status === 429 || /429|rate limit/i.test(message)) return "The provider rate limit was reached. Wait briefly, retry, or choose another provider.";
  if (error?.status === 502 || error?.status === 503) return "The selected model is temporarily unavailable. Retry or use another provider or Template PDF.";
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
