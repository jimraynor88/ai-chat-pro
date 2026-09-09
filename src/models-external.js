import { sha256Hex } from "./util.js";

export function isExternal(modelKey) {
  return typeof modelKey === "string" && modelKey.startsWith("ext:");
}

export function resolveExternal(modelKey, modelsExt) {
  if (!isExternal(modelKey)) return null;
  const id = modelKey.slice(4);
  return (modelsExt || []).find(m => m.id === id) || null;
}

function estTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

function msgsToText(messages) {
  return messages.map(m => typeof m.content === "string" ? m.content : JSON.stringify(m.content || "")).join("\n");
}

function splitDataUrl(dataUrl) {
  const i = dataUrl.indexOf(",");
  const head = dataUrl.slice(0, i);
  const b64 = dataUrl.slice(i + 1);
  const mt = head.slice(head.indexOf(":") + 1, head.indexOf(";"));
  return { mediaType: mt || "image/png", b64 };
}

function wireContent(content, target) {
  if (typeof content === "string") return content;
  return (content || []).map(p => {
    if (p.type === "text") return { type: "text", text: p.text };
    const { mediaType, b64 } = splitDataUrl(p.image_url.url);
    if (target === "anthropic") return { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } };
    if (target === "cf") return { type: "image", image: b64 };
    return { type: "image_url", image_url: { url: p.image_url.url } };
  });
}

export function toWire(messages, target) {
  if (target === "anthropic") {
    const sys = messages.filter(m => m.role === "system")
      .map(m => typeof m.content === "string" ? m.content : (m.content || []).filter(p => p.type === "text").map(p => p.text).join(" "))
      .join("\n");
    const msgs = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: wireContent(m.content, "anthropic")
    }));
    return { system: sys || undefined, messages: msgs };
  }
  return messages.map(m => ({ role: m.role, content: wireContent(m.content, target) }));
}

async function callOpenAICompat(m, wire) {
  const url = (m.baseUrl || "").replace(/\/+$/, "") + "/chat/completions";
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + m.apiKey },
    body: JSON.stringify({ model: m.modelId, messages: wire })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d.error && (d.error.message || d.error)) || "HTTP " + r.status);
  const text = d.choices && d.choices[0] && d.choices[0].message ? d.choices[0].message.content : "";
  return {
    response: text,
    promptTokens: d.usage ? d.usage.prompt_tokens : estTokens(msgsToText(wire)),
    completionTokens: d.usage ? d.usage.completion_tokens : estTokens(text)
  };
}

async function callAnthropic(m, wire) {
  const base = (m.baseUrl || "https://api.anthropic.com").replace(/\/+$/, "");
  const r = await fetch(base + "/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": m.apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: m.modelId, max_tokens: 4096, system: wire.system, messages: wire.messages })
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d.error && d.error.message) || "HTTP " + r.status);
  const text = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("");
  return {
    response: text,
    promptTokens: d.usage ? d.usage.input_tokens : estTokens(msgsToText(wire.messages)),
    completionTokens: d.usage ? d.usage.output_tokens : estTokens(text)
  };
}

export async function runExternal(m, messages) {
  if (m.provider === "anthropic") return callAnthropic(m, toWire(messages, "anthropic"));
  return callOpenAICompat(m, toWire(messages, "openai"));
}
