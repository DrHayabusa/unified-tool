import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_PROVIDERS,
  buildOpenAiRequest,
  callOpenAiCompatible,
  completionText,
  isHostedNvidiaUrl,
  parseEventStreamText,
  providerById,
  validateProviderSettings,
} from "./aiProviders.js";

test("provider catalog exposes working cloud, enterprise, and local paths", () => {
  assert.deepEqual(AI_PROVIDERS.map((provider) => provider.id), [
    "nvidia-nim",
    "openrouter-nemotron-ultra",
    "groq-gpt-oss-120b",
    "mva-cloud-api",
    "template-pdf",
  ]);
  assert.equal(providerById("missing").id, "nvidia-nim");
});

test("OpenRouter request includes attribution and never puts the key in the body", () => {
  const provider = providerById("openrouter-nemotron-ultra");
  const request = buildOpenAiRequest({
    provider,
    baseUrl: provider.baseUrl,
    apiKey: "session-secret",
    model: provider.model,
    messages: [{ role: "user", content: "MVA test" }],
    maxTokens: 16,
  });
  const body = JSON.parse(request.options.body);
  assert.equal(request.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(request.options.headers.Authorization, "Bearer session-secret");
  assert.equal(request.options.headers["X-OpenRouter-Title"], "MVA Unified Agent");
  assert.equal(body.model, "nvidia/nemotron-3-ultra-550b-a55b:free");
  assert.equal(request.options.body.includes("session-secret"), false);
});

test("provider validation blocks missing keys and direct HTTP cloud URLs", () => {
  const groq = providerById("groq-gpt-oss-120b");
  assert.match(validateProviderSettings({ provider: groq, baseUrl: groq.baseUrl, apiKey: "", model: groq.model }), /Groq API Key/);
  assert.match(validateProviderSettings({ provider: groq, baseUrl: "http://example.com", apiKey: "key", model: groq.model }), /HTTPS/);
  assert.equal(validateProviderSettings({ provider: groq, baseUrl: groq.baseUrl, apiKey: "key", model: groq.model }), "");
});

test("NVIDIA route requires a CORS-enabled MVA relay", () => {
  const nvidia = providerById("nvidia-nim");
  const relayUrl = "https://mva-relay.example/v1";
  assert.equal(validateProviderSettings({ provider: nvidia, baseUrl: relayUrl, apiKey: "nvapi-test", model: nvidia.model }), "");
  assert.match(validateProviderSettings({ provider: nvidia, baseUrl: relayUrl, apiKey: "", model: nvidia.model }), /NVIDIA API Key/);
  assert.match(validateProviderSettings({ provider: nvidia, baseUrl: "https://integrate.api.nvidia.com/v1", apiKey: "nvapi-test", model: nvidia.model }), /blocks requests from GitHub Pages/);
  assert.equal(isHostedNvidiaUrl("https://integrate.api.nvidia.com/v1"), true);
  const request = buildOpenAiRequest({ provider: nvidia, baseUrl: relayUrl, apiKey: "nvapi-test", model: nvidia.model, messages: [] });
  assert.equal(request.url, "https://mva-relay.example/v1/chat/completions");
});

test("OpenAI-compatible caller parses success and provider errors", async () => {
  const provider = providerById("groq-gpt-oss-120b");
  const success = await callOpenAiCompatible({
    provider,
    baseUrl: provider.baseUrl,
    apiKey: "test-key",
    model: provider.model,
    messages: [{ role: "user", content: "Ready?" }],
    maxTokens: 8,
    fetchImpl: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: "MVA READY" } }] }) }),
  });
  assert.equal(completionText(success), "MVA READY");

  await assert.rejects(
    callOpenAiCompatible({
      provider,
      baseUrl: provider.baseUrl,
      apiKey: "bad-key",
      model: provider.model,
      messages: [],
      fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ error: { message: "Invalid API key" } }) }),
    }),
    /Invalid API key/,
  );
});

test("completion text handles reasoning-only compatible responses", () => {
  const payload = { choices: [{ message: { reasoning_content: "MVA READY" } }] };
  assert.equal(completionText(payload), "");
  assert.equal(completionText(payload, { allowReasoning: true }), "MVA READY");
});

test("NVIDIA event streams are assembled into one completion", () => {
  const payload = parseEventStreamText([
    'data: {"choices":[{"delta":{"reasoning_content":"checking "}}]}',
    'data: {"choices":[{"delta":{"content":"MVA "}}]}',
    'data: {"choices":[{"delta":{"content":"READY"}}]}',
    "data: [DONE]",
  ].join("\n"));
  assert.equal(completionText(payload), "MVA READY");
  assert.equal(payload.choices[0].message.reasoning_content, "checking ");
});
