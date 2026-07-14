export const AI_PROVIDERS = Object.freeze([
  {
    id: "nvidia-nim",
    name: "NVIDIA NIM - Nemotron 3 Ultra",
    helper: "Direct NVIDIA Build API access using a session-only key, base URL, and model route.",
    model: "nvidia/nemotron-3-ultra-550b-a55b",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    type: "openai",
    service: "nvidia",
    badge: "Direct NVIDIA",
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
  if (provider.requiresKey && !String(apiKey || "").trim()) {
    return `Paste a ${provider.keyLabel} for this browser session.`;
  }
  if (provider.type !== "backend" && !String(model || "").trim()) {
    return "Enter a model route.";
  }
  return "";
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
        stream: false,
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
