const NVIDIA_RELAY_URL = String(import.meta.env?.VITE_NVIDIA_RELAY_URL ?? "").trim();

export const AI_PROVIDERS = Object.freeze([
  {
    id: "nvidia-nim",
    name: "NVIDIA NIM - Nemotron 3 Ultra",
    helper: "NVIDIA Build API access through the MVA HTTPS relay because the hosted NVIDIA endpoint blocks browser CORS.",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    baseUrl: NVIDIA_RELAY_URL,
    type: "openai",
    service: "nvidia",
    badge: "Secure relay",
    keyLabel: "NVIDIA API Key",
    keyPlaceholder: "nvapi-...",
    keyUrl: "https://build.nvidia.com/settings/api-keys",
    requiresKey: true,
  },
  {
    id: "openrouter-nemotron-ultra",
    name: "OpenRouter - Nemotron 3 Ultra",
    helper: "Direct cloud access to NVIDIA Nemotron 3 Ultra with a free model route and browser-compatible API.",
    model: "nvidia/nemotron-3-ultra-550b-a55b:free",
    baseUrl: "https://openrouter.ai/api/v1",
    type: "openai",
    service: "openrouter",
    badge: "Best direct cloud",
    keyLabel: "OpenRouter API Key",
    keyPlaceholder: "sk-or-v1-...",
    keyUrl: "https://openrouter.ai/settings/keys",
    requiresKey: true,
  },
  {
    id: "groq-gpt-oss-120b",
    name: "Groq - GPT OSS 120B",
    helper: "Fast production inference using Groq's current 120B open-weight reasoning model.",
    model: "openai/gpt-oss-120b",
    baseUrl: "https://api.groq.com/openai/v1",
    type: "openai",
    service: "groq",
    badge: "Fast production",
    keyLabel: "Groq API Key",
    keyPlaceholder: "gsk_...",
    keyUrl: "https://console.groq.com/keys",
    requiresKey: true,
  },
  {
    id: "mva-cloud-api",
    name: "MVA Cloud API",
    helper: "Organization-hosted report service with provider credentials held entirely on the backend.",
    model: "mva-remediation-agent",
    baseUrl: "",
    type: "backend",
    service: "mva",
    badge: "Enterprise custody",
    keyLabel: "MVA API Token",
    keyPlaceholder: "Optional bearer token",
    keyUrl: "",
    requiresKey: false,
  },
  {
    id: "template-pdf",
    name: "Template PDF - No AI",
    helper: "Builds the approved Remediation Guide locally without sending findings to an external model.",
    model: "No external model",
    baseUrl: "",
    type: "template",
    service: "local",
    badge: "Always available",
    keyLabel: "",
    keyPlaceholder: "",
    keyUrl: "",
    requiresKey: false,
  },
]);

export function providerById(providerId) {
  return AI_PROVIDERS.find((provider) => provider.id === providerId) ?? AI_PROVIDERS[0];
}

export function validateProviderSettings({ provider, baseUrl, apiKey, model }) {
  if (provider.type === "template") return "";
  if (!String(baseUrl || "").trim()) {
    return "Enter the cloud provider base URL.";
  }
  if (!/^https:\/\//i.test(String(baseUrl).trim()) && !isLoopbackUrl(baseUrl)) {
    return "Use an HTTPS cloud URL. HTTP is accepted only for localhost development.";
  }
  if (provider.service === "nvidia" && isHostedNvidiaUrl(baseUrl)) {
    return "NVIDIA's hosted API blocks requests from GitHub Pages. Enter the MVA NVIDIA Relay URL, not integrate.api.nvidia.com.";
  }
  if (provider.requiresKey && !String(apiKey || "").trim()) {
    return `Paste a ${provider.keyLabel} for this browser session.`;
  }
  if (provider.type !== "backend" && !String(model || "").trim()) {
    return "Enter a model route.";
  }
  return "";
}

export function isHostedNvidiaUrl(value) {
  try {
    return new URL(String(value).trim()).hostname.toLowerCase() === "integrate.api.nvidia.com";
  } catch {
    return false;
  }
}

export function buildOpenAiRequest({ provider, baseUrl, apiKey, model, messages, maxTokens = 8192, report = false }) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${String(apiKey || "").trim()}`,
  };
  if (provider.service === "openrouter") {
    headers["HTTP-Referer"] = currentSiteUrl();
    headers["X-OpenRouter-Title"] = "MVA Unified Agent";
  }

  return {
    url: joinUrl(baseUrl, "/chat/completions"),
    options: {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: String(model || "").trim(),
        messages,
        temperature: report ? 0.2 : 0,
        top_p: report ? 0.9 : 1,
        max_tokens: maxTokens,
        stream: provider.service === "nvidia",
      }),
    },
  };
}

export async function callOpenAiCompatible({
  provider,
  baseUrl,
  apiKey,
  model,
  messages,
  maxTokens,
  report = false,
  signal,
  fetchImpl = fetch,
}) {
  const { url, options } = buildOpenAiRequest({ provider, baseUrl, apiKey, model, messages, maxTokens, report });
  const response = await fetchImpl(url, { ...options, signal });
  if (response.ok && response.headers?.get?.("content-type")?.includes("text/event-stream")) {
    return readEventStream(response);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.error?.message || payload?.detail || payload?.message || `${provider.name} returned HTTP ${response.status}.`;
    const error = new Error(detail);
    error.status = response.status;
    error.provider = provider.service;
    throw error;
  }
  return payload;
}

async function readEventStream(response) {
  if (!response.body?.getReader) return parseEventStreamText(await response.text());
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let reasoning = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = done ? "" : lines.pop() ?? "";
    for (const line of lines) {
      const delta = parseEventLine(line);
      content += delta.content;
      reasoning += delta.reasoning;
    }
    if (done) break;
  }
  if (buffer) {
    const delta = parseEventLine(buffer);
    content += delta.content;
    reasoning += delta.reasoning;
  }
  return completionPayload(content, reasoning);
}

export function parseEventStreamText(text) {
  let content = "";
  let reasoning = "";
  for (const line of String(text || "").split(/\r?\n/)) {
    const delta = parseEventLine(line);
    content += delta.content;
    reasoning += delta.reasoning;
  }
  return completionPayload(content, reasoning);
}

function parseEventLine(line) {
  if (!line.startsWith("data:")) return { content: "", reasoning: "" };
  const data = line.slice(5).trim();
  if (!data || data === "[DONE]") return { content: "", reasoning: "" };
  try {
    const delta = JSON.parse(data)?.choices?.[0]?.delta ?? {};
    return {
      content: typeof delta.content === "string" ? delta.content : "",
      reasoning: typeof delta.reasoning_content === "string" ? delta.reasoning_content : "",
    };
  } catch {
    return { content: "", reasoning: "" };
  }
}

function completionPayload(content, reasoning) {
  return { choices: [{ message: { content, reasoning_content: reasoning } }] };
}

export function completionText(payload, { allowReasoning = false } = {}) {
  const message = payload?.choices?.[0]?.message;
  if (typeof message?.content === "string" && message.content.trim()) return message.content.trim();
  if (allowReasoning && typeof message?.reasoning_content === "string" && message.reasoning_content.trim()) {
    return message.reasoning_content.trim();
  }
  return "";
}

export function joinUrl(baseUrl, path) {
  return `${String(baseUrl || "").replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function currentSiteUrl() {
  if (typeof window === "undefined") return "https://drhayabusa.github.io/unified-tool/";
  return `${window.location.origin}${window.location.pathname}`;
}

function isLoopbackUrl(value) {
  try {
    const host = new URL(String(value)).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}
