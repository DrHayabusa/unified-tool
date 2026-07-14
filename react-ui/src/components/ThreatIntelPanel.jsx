import { useState } from "react";
import { ArrowLeft, Bot, ExternalLink, KeyRound, Radar, Search, Server, ShieldAlert, Sparkles } from "lucide-react";
import { callOpenAiCompatible, completionText, joinUrl, providerById, validateProviderSettings } from "../lib/aiProviders.js";
import { buildLocalThreatIntel, buildThreatIntelPrompt, normalizeThreatIntel, parseThreatIntelResponse } from "../lib/threatIntel.js";

const SOURCES = [
  { id: "local", label: "Uploaded Scanner Data", helper: "Search the currently analyzed Tenable, Qualys, or CrowdStrike findings locally.", icon: Search },
  { id: "nvidia", label: "NVIDIA NIM", helper: "Use Nemotron with a session-only NVIDIA key, base URL, and model route.", icon: Bot },
  { id: "tenable-api", label: "Tenable via MVA API", helper: "Query Tenable intelligence through your organization-controlled backend.", icon: ShieldAlert },
  { id: "ai-server", label: "MVA AI Server", helper: "Request enriched vulnerability intelligence from your internal AI service.", icon: Server },
  { id: "openrouter", label: "OpenRouter / Nemotron", helper: "Session-only direct AI enrichment using an OpenRouter key.", icon: Bot },
];

export function ThreatIntelPanel({ analysis, onBackToDashboard }) {
  const [query, setQuery] = useState("");
  const [sourceId, setSourceId] = useState("local");
  const [baseUrl, setBaseUrl] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [directBaseUrl, setDirectBaseUrl] = useState(providerById("nvidia-nim").baseUrl);
  const [model, setModel] = useState(providerById("nvidia-nim").model);
  const [status, setStatus] = useState({ state: "idle", message: "Enter a vulnerability name or CVE to begin." });
  const [result, setResult] = useState(null);
  const selectedSource = SOURCES.find((source) => source.id === sourceId) ?? SOURCES[0];
  const busy = status.state === "loading";

  const investigate = async (event) => {
    event.preventDefault();
    const searchText = query.trim();
    if (searchText.length < 2) {
      setStatus({ state: "error", message: "Enter a vulnerability name, CVE, QID, or plugin identifier." });
      return;
    }

    setStatus({ state: "loading", message: `Investigating ${searchText}...` });
    setResult(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90_000);
    try {
      if (sourceId === "local") {
        const intel = buildLocalThreatIntel(analysis, searchText);
        setResult(normalizeThreatIntel(intel, intel.source));
      } else if (sourceId === "openrouter" || sourceId === "nvidia") {
        const provider = providerById(sourceId === "nvidia" ? "nvidia-nim" : "openrouter-nemotron-ultra");
        const validationError = validateProviderSettings({ provider, baseUrl: directBaseUrl, apiKey, model });
        if (validationError) throw new Error(validationError);
        const localContext = optionalLocalContext(analysis, searchText);
        const payload = await callOpenAiCompatible({
          provider,
          baseUrl: directBaseUrl,
          apiKey,
          model,
          messages: [
            { role: "system", content: "You are a defensive vulnerability threat-intelligence analyst. Return evidence-based JSON only and never invent CVEs, patches, versions, or links." },
            { role: "user", content: buildThreatIntelPrompt(searchText, localContext) },
          ],
          maxTokens: 4096,
          signal: controller.signal,
        });
        setResult(parseThreatIntelResponse(completionText(payload, { allowReasoning: true }), provider.name));
      } else {
        if (!/^https:\/\//i.test(baseUrl) && !/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i.test(baseUrl)) {
          throw new Error("Enter your organization MVA API HTTPS URL.");
        }
        const endpoint = sourceId === "tenable-api" ? "/threat-intel/tenable" : "/threat-intel/ai";
        const response = await fetch(joinUrl(baseUrl, endpoint), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionToken.trim() ? { Authorization: `Bearer ${sessionToken.trim()}` } : {}),
          },
          body: JSON.stringify({
            query: searchText,
            sourceTool: analysis?.sourceLabel || "No local scanner context",
            localContext: optionalLocalContext(analysis, searchText),
          }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || payload.detail || payload.message || `MVA API returned HTTP ${response.status}.`);
        setResult(normalizeThreatIntel(payload, selectedSource.label));
      }
      setStatus({ state: "success", message: "Threat-intelligence analysis completed." });
    } catch (error) {
      setStatus({ state: "error", message: error.name === "AbortError" ? "Threat-intelligence request timed out after 90 seconds." : error.message || "Threat-intelligence analysis failed." });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  return (
    <section className="rounded-[1.75rem] border border-red-400/15 bg-slate-950/85 p-5 shadow-cyber backdrop-blur-xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 text-cyan-200"><Radar className="h-6 w-6" /></span>
          <div>
            <p className="mini-label">Intelligence as a Service</p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-white">Threat Intelligence Feed</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">Investigate affected products, exploitation evidence, attack path, patches, remediation, and authoritative references.</p>
          </div>
        </div>
        <button type="button" onClick={onBackToDashboard} className="ghost-button flex items-center gap-2 py-2.5"><ArrowLeft className="h-4 w-4" />Back to Dashboard</button>
      </div>

      <form onSubmit={investigate} className="grid gap-5 xl:grid-cols-[1fr_390px]">
        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">Vulnerability, CVE, QID, or plugin</span>
            <div className="flex overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-[0_0_0_1px_rgba(34,211,238,.04)] focus-within:border-cyan-300/55">
              <Search className="ml-4 mt-4 h-5 w-5 shrink-0 text-cyan-300" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Example: CVE-2021-44228 or Apache Log4j RCE" className="min-w-0 flex-1 bg-transparent px-4 py-4 font-semibold text-white outline-none placeholder:text-slate-600" />
              <button type="submit" disabled={busy} className="m-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-50">{busy ? "Investigating..." : "Investigate"}</button>
            </div>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            {SOURCES.map((source) => {
              const Icon = source.icon;
              const active = source.id === sourceId;
              return <button key={source.id} type="button" onClick={() => { setSourceId(source.id); setResult(null); if (source.id === "nvidia" || source.id === "openrouter") { const nextProvider = providerById(source.id === "nvidia" ? "nvidia-nim" : "openrouter-nemotron-ultra"); setDirectBaseUrl(nextProvider.baseUrl); setModel(nextProvider.model); setApiKey(""); } }} className={`rounded-2xl border p-4 text-left transition ${active ? "border-emerald-300/45 bg-emerald-400/10" : "border-white/10 bg-slate-900/55 hover:border-cyan-300/30"}`}><div className="flex items-center gap-3"><Icon className={`h-5 w-5 ${active ? "text-emerald-300" : "text-slate-500"}`} /><p className="font-black text-white">{source.label}</p></div><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{source.helper}</p></button>;
            })}
          </div>

          {(sourceId === "tenable-api" || sourceId === "ai-server") && (
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/55 p-4 md:grid-cols-2">
              <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">MVA API URL</span><input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://mva-api.your-org.example" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none focus:border-cyan-300/40" /></label>
              <label><span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><KeyRound className="h-4 w-4" />Session token (optional)</span><input type="password" value={sessionToken} onChange={(event) => setSessionToken(event.target.value)} autoComplete="off" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none focus:border-cyan-300/40" /></label>
            </div>
          )}

          {(sourceId === "openrouter" || sourceId === "nvidia") && (
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/55 p-4 lg:grid-cols-3">
              <label><span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><KeyRound className="h-4 w-4" />{sourceId === "nvidia" ? "NVIDIA" : "OpenRouter"} key (session only)</span><input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={sourceId === "nvidia" ? "nvapi-..." : "sk-or-v1-..."} autoComplete="off" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none focus:border-cyan-300/40" /></label>
              <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Provider base URL</span><input value={directBaseUrl} onChange={(event) => setDirectBaseUrl(event.target.value)} inputMode="url" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none focus:border-cyan-300/40" /></label>
              <label><span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">Model route</span><input value={model} onChange={(event) => setModel(event.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none focus:border-cyan-300/40" /></label>
            </div>
          )}

          <Status status={status} />
        </div>

        <aside className="rounded-2xl border border-white/10 bg-slate-900/55 p-5">
          <p className="mini-label">Source Context</p>
          <h3 className="mt-2 text-xl font-black text-white">{selectedSource.label}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{selectedSource.helper}</p>
          <div className="mt-5 space-y-3 text-xs font-semibold text-slate-400">
            <ContextRow label="Local dataset" value={analysis ? analysis.sourceLabel : "No analyzed data"} />
            <ContextRow label="Credential storage" value="Browser session only" />
            <ContextRow label="Raw file transfer" value="Never" />
          </div>
        </aside>
      </form>

      {result && <ThreatIntelResult result={result} />}
    </section>
  );
}

function ThreatIntelResult({ result }) {
  return (
    <section className="mt-6 border-t border-white/10 pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="mini-label">Intelligence Result</p><h3 className="mt-1 text-2xl font-black text-white">Defensive vulnerability intelligence</h3></div><span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200">{result.source}</span></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <IntelMetric label="Severity" value={result.highestSeverity} tone="text-red-300" />
        <IntelMetric label="Exploit" value={result.exploitAvailable ? "Available / observed" : "Unconfirmed"} tone={result.exploitAvailable ? "text-orange-300" : "text-emerald-300"} />
        <IntelMetric label="Matching findings" value={result.matchedFindings || "N/A"} tone="text-cyan-300" />
        <IntelMetric label="Affected assets" value={result.affectedAssetCount || "N/A"} tone="text-yellow-200" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <IntelSection title="Executive Summary" items={[result.summary]} icon={Sparkles} />
        <IntelSection title="Exploitability and Attack Path" items={[result.exploitEvidence, result.attackPath].filter((item) => item && item !== "Unknown")} icon={ShieldAlert} />
        <IntelSection title="Affected Products and Versions" items={[...result.affectedProducts, ...result.affectedVersions]} icon={Server} />
        <IntelSection title="Patches and Remediation" items={[...result.patches, ...result.remediationSteps]} icon={ShieldAlert} />
        <IntelSection title="Detection and Validation" items={result.detectionSteps} icon={Search} />
        <IntelSection title="References" items={result.references} links icon={ExternalLink} />
      </div>
    </section>
  );
}

function IntelMetric({ label, value, tone }) {
  return <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-4"><p className="font-mono text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className={`mt-2 text-xl font-black ${tone}`}>{value}</p></article>;
}

function IntelSection({ title, items = [], links = false, icon: Icon }) {
  const visible = [...new Set(items.filter(Boolean))];
  return <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-5"><div className="mb-4 flex items-center gap-3"><Icon className="h-5 w-5 text-cyan-300" /><h4 className="font-black text-white">{title}</h4></div>{visible.length ? <ul className="space-y-3 text-sm font-semibold leading-6 text-slate-400">{visible.map((item) => <li key={item} className="border-l-2 border-cyan-300/25 pl-3">{links ? <a href={item} target="_blank" rel="noreferrer" className="break-all text-cyan-300 hover:text-cyan-200">{item}</a> : item}</li>)}</ul> : <p className="text-sm font-semibold text-slate-600">No verified information returned.</p>}</article>;
}

function ContextRow({ label, value }) {
  return <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3"><span className="text-slate-600">{label}</span><span className="text-right font-black text-slate-300">{value}</span></div>;
}

function Status({ status }) {
  const classes = status.state === "error" ? "border-red-300/25 bg-red-400/10 text-red-200" : status.state === "success" ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : status.state === "loading" ? "border-cyan-300/25 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.035] text-slate-400";
  return <div aria-live="polite" className={`rounded-2xl border px-4 py-3 text-xs font-bold ${classes}`}>{status.message}</div>;
}

function optionalLocalContext(analysis, query) {
  try {
    return analysis ? buildLocalThreatIntel(analysis, query) : null;
  } catch {
    return null;
  }
}
