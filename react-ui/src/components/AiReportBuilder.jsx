import { useState } from "react";
import { Bot, CheckCircle2, ChevronDown, ExternalLink, FileText, KeyRound, LockKeyhole, Wifi } from "lucide-react";
import { callOpenAiCompatible, completionText, providerById, validateProviderSettings } from "../lib/aiProviders.js";
import { buildRemediationPrompt, buildTemplateMarkdown, downloadRemediationPdf } from "../lib/pdfReport.js";

export function AiReportBuilder({ analysis, selectedMonth, onMonthChange, monthOptions = [], compact = false, workflow = "adhoc" }) {
  const provider = providerById("nvidia-nim");
  const [sessionApiKey, setSessionApiKey] = useState("");
  const [providerBaseUrl, setProviderBaseUrl] = useState(provider.baseUrl);
  const [providerModel, setProviderModel] = useState(provider.model);
  const [connectionState, setConnectionState] = useState({ status: "idle", message: "Not tested yet" });
  const [reportState, setReportState] = useState({ status: "idle", message: "No report generated yet" });
  const periodName = workflow === "monthly" ? "Month" : workflow === "quarterly" ? "Quarter" : "Period";
  const hasPeriods = monthOptions.length > 0 && !monthOptions.some((value) => /^No .*detected/i.test(value));
  const targetPeriod = selectedMonth && !/^No .*detected/i.test(selectedMonth) ? selectedMonth : hasPeriods ? monthOptions.at(-1) : "";
  const busy = connectionState.status === "testing" || reportState.status === "testing";

  const validate = () => validateProviderSettings({ provider, baseUrl: providerBaseUrl, apiKey: sessionApiKey, model: providerModel });

  const testConnectivity = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      setConnectionState({ status: "error", message: errorMessage });
      return;
    }
    setConnectionState({ status: "testing", message: "Testing NVIDIA NIM through the secure relay..." });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 600_000);
    try {
      await callOpenAiCompatible({
        provider,
        baseUrl: providerBaseUrl,
        apiKey: sessionApiKey,
        model: providerModel,
        messages: [{ role: "user", content: "Reply with exactly: MVA READY" }],
        maxTokens: 16,
        signal: controller.signal,
      });
      setConnectionState({ status: "success", message: `Connected to ${providerModel}. Relay and NVIDIA authorization verified.` });
    } catch (error) {
      setConnectionState({ status: "error", message: providerError(error) });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const generateAiReport = async () => {
    const readinessError = reportReadinessError({ analysis, targetPeriod, periodName }) || validate();
    if (readinessError) {
      setReportState({ status: "error", message: readinessError });
      return;
    }
    setReportState({ status: "testing", message: `Generating the ${targetPeriod} Remediation Guide with NVIDIA. A complete guide can take 2-5 minutes; keep this tab open.` });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 600_000);
    try {
      const payload = await callOpenAiCompatible({
        provider,
        baseUrl: providerBaseUrl,
        apiKey: sessionApiKey,
        model: providerModel,
        messages: [
          { role: "system", content: "You are the MVA Remediation Guide engine. Return customer-ready Markdown only. Never invent commands, versions, KB identifiers, CVEs, or links." },
          { role: "user", content: buildRemediationPrompt({ analysis, targetMonth: targetPeriod }) },
        ],
        maxTokens: 8192,
        report: true,
        signal: controller.signal,
      });
      const markdown = completionText(payload, { allowReasoning: true });
      if (!markdown) throw new Error("NVIDIA returned no final report content.");
      await downloadRemediationPdf({ markdown, sourceLabel: analysis.sourceLabel, targetMonth: targetPeriod, workflow });
      setReportState({ status: "success", message: `NVIDIA Remediation Guide downloaded for ${targetPeriod}.` });
    } catch (error) {
      setReportState({ status: "error", message: providerError(error) });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const generateLocalReport = async () => {
    const readinessError = reportReadinessError({ analysis, targetPeriod, periodName });
    if (readinessError) {
      setReportState({ status: "error", message: readinessError });
      return;
    }
    setReportState({ status: "testing", message: `Building the ${targetPeriod} local Remediation Guide...` });
    try {
      const markdown = buildTemplateMarkdown({ analysis, targetMonth: targetPeriod });
      await downloadRemediationPdf({ markdown, sourceLabel: analysis.sourceLabel, targetMonth: targetPeriod, workflow });
      setReportState({ status: "success", message: `Local Remediation Guide downloaded for ${targetPeriod}.` });
    } catch (error) {
      setReportState({ status: "error", message: error.message || "Local PDF generation failed." });
    }
  };

  return (
    <section className="cyber-panel rounded-[1.75rem] p-5">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3"><Bot className="h-7 w-7 text-red-300" /><div><p className="mini-label">AI Report Builder</p><h2 className="text-xl font-bold text-white">NVIDIA Remediation Guide</h2></div></div>
        <a href={provider.keyUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-red-300/20 bg-red-500/[0.07] px-3 py-2 text-xs font-bold text-red-200">Generate key <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a>
      </div>

      <div className="space-y-4">
        <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-400"><KeyRound className="h-4 w-4" />NVIDIA API Key (session only)</span><input type="password" value={sessionApiKey} onChange={(event) => setSessionApiKey(event.target.value)} placeholder="nvapi-..." autoComplete="off" spellCheck="false" className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xs font-bold text-slate-100 outline-none focus:border-red-300/40" /></label>
        <label className="block"><span className="mb-2 block text-sm font-bold text-slate-400">MVA NVIDIA Relay URL</span><input value={providerBaseUrl} onChange={(event) => setProviderBaseUrl(event.target.value)} placeholder="https://your-relay.example/v1" inputMode="url" spellCheck="false" className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xs font-bold text-slate-100 outline-none focus:border-red-300/40" /></label>
        <label className="block"><span className="mb-2 block text-sm font-bold text-slate-400">Model Route</span><input value={providerModel} onChange={(event) => setProviderModel(event.target.value)} spellCheck="false" className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-mono text-xs font-bold text-slate-100 outline-none focus:border-red-300/40" /></label>

        <label className="block"><span className="mb-2 block text-sm font-bold text-slate-400">PDF Target {periodName}</span><div className="relative"><select value={targetPeriod} onChange={(event) => onMonthChange?.(event.target.value)} disabled={!hasPeriods} className="w-full appearance-none rounded-xl border border-white/10 bg-black/35 px-4 py-3 pr-11 font-bold text-slate-100 outline-none disabled:opacity-50">{hasPeriods ? monthOptions.map((period) => <option key={period}>{period}</option>) : <option value="">No {periodName.toLowerCase()} detected yet</option>}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" /></div></label>

        {!compact && <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-500"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" />Scanner parsing, field mapping, priority scoring, comparisons, and dashboards stay local. Only the selected report summary and prioritized normalized findings are sent to NVIDIA when Generate AI PDF is clicked.</p>}
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><p className="flex items-start gap-2 text-xs font-semibold leading-5 text-slate-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />The browser sends the session-only key to the MVA HTTPS relay; the relay calls NVIDIA server-to-server. The key is not stored by this application.</p></div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={testConnectivity} disabled={busy} className="ghost-button flex items-center justify-center gap-2 disabled:opacity-50"><Wifi className="h-4 w-4" />Test NVIDIA</button>
          <button type="button" onClick={generateAiReport} disabled={busy} className="neon-button flex items-center justify-center gap-2 disabled:opacity-50"><FileText className="h-4 w-4" />Generate AI PDF</button>
          <button type="button" onClick={generateLocalReport} disabled={busy} className="ghost-button flex items-center justify-center gap-2 disabled:opacity-50"><FileText className="h-4 w-4" />Local PDF</button>
        </div>
        <StatusBox label="NVIDIA" state={connectionState} />
        <StatusBox label="PDF" state={reportState} />
      </div>
    </section>
  );
}

function reportReadinessError({ analysis, targetPeriod, periodName }) {
  if (!analysis) return "Analyze an upload before generating the PDF.";
  if (!targetPeriod) return `Select the PDF target ${periodName.toLowerCase()} first.`;
  return "";
}

function StatusBox({ label, state }) {
  const classes = state.status === "success" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : state.status === "error" ? "border-red-300/25 bg-red-400/10 text-red-200" : state.status === "testing" ? "border-red-300/25 bg-red-400/[0.07] text-red-200" : "border-white/10 bg-white/[0.025] text-slate-500";
  return <div aria-live="polite" className={`rounded-xl border px-4 py-3 text-xs font-bold ${classes}`}>{label}: {state.message}</div>;
}

function providerError(error) {
  const message = error?.name === "AbortError" ? "The NVIDIA request timed out." : error?.message || "The NVIDIA request failed.";
  if (error?.status === 401 || /401|unauthorized|invalid api key/i.test(message)) return "Unauthorized: generate a fresh NVIDIA key and paste the complete value for this session.";
  if (error?.status === 403 || /forbidden/i.test(message)) return "NVIDIA rejected this model or key permission. Verify model access for the key.";
  if (error?.status === 429 || /rate limit/i.test(message)) return "NVIDIA rate limit reached. Wait briefly and retry.";
  if (/failed to fetch/i.test(message)) return "The browser could not reach the configured MVA NVIDIA relay. Keep the prefilled relay URL, refresh the page, and confirm your VPN or firewall allows the relay domain.";
  return message;
}
