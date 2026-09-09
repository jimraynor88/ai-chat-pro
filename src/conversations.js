import { estimateNeurons, resolveModel } from "./models.js";
import { isExternal, resolveExternal, runExternal, toWire } from "./models-external.js";
import { loadFileIndex, getFileText } from "./files.js";
import { getExternal } from "./storage-external.js";
import { r2Json, r2PutJson, todayStr } from "./util.js";

const CONV_IDX = "conversaciones/index:conversations";
const FOLDER_IDX = "conversaciones/index:folders";

function bufToB64(buf) {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}

async function readConv(env, id) {
  const o = await env.R2.get("conversaciones/conv:" + id);
  if (!o) return null;
  return JSON.parse(await o.text());
}

async function writeConv(env, conv) {
  await env.R2.put("conversaciones/conv:" + conv.id, JSON.stringify(conv));
}

async function syncIndex(env, conv, preview) {
  const idx = await r2Json(env, CONV_IDX, []);
  const e = idx.find(c => c.id === conv.id);
  if (e) {
    e.title = conv.title; e.folderId = conv.folderId; e.pinned = conv.pinned;
    e.color = conv.color; e.model = conv.model; e.updatedAt = conv.updatedAt;
    if (preview !== undefined) e.preview = preview;
  }
  if (!e) idx.unshift({ id: conv.id, title: conv.title, folderId: conv.folderId, pinned: conv.pinned, color: conv.color, model: conv.model, createdAt: conv.createdAt, updatedAt: conv.updatedAt, preview: preview || "" });
  await r2PutJson(env, CONV_IDX, idx);
}

async function fileToDataUrl(env, f, settings) {
  try {
    let buf;
    if (f.external) buf = await getExternal(settings.storageExt, f.hash, f.url);
    else { const o = await env.R2.get("archivos/data:" + f.hash); if (!o) return null; buf = await o.arrayBuffer(); }
    return "data:" + (f.mime || "application/octet-stream") + ";base64," + bufToB64(buf);
  } catch (e) { return null; }
}

export async function getState(env, settings) {
  const [convIdx, folderIdx, usage, usageExt] = await Promise.all([
    r2Json(env, CONV_IDX, []),
    r2Json(env, FOLDER_IDX, []),
    r2Json(env, "conversaciones/usage:" + todayStr(), { neurons: 0, messages: 0 }),
    r2Json(env, "ajustes/usage-ext:" + todayStr(), {})
  ]);
  return Response.json({
    conversations: convIdx,
    folders: folderIdx,
    readNews: settings.readNews || [],
    usage,
    usageExt,
    defaultModel: settings.defaultModel || "",
    modelPrompts: settings.modelPrompts || {},
    modelsExt: (settings.modelsExt || []).map(m => ({
      id: m.id, name: m.name, modelId: m.modelId, provider: m.provider,
      fileTypes: m.fileTypes || ["text"], nIn: m.nIn || 0, nOut: m.nOut || 0,
      costIn: m.costIn || 0, costOut: m.costOut || 0, dailyLimit: m.dailyLimit || 0,
      acceptsImage: (m.fileTypes || []).includes("image")
    }))
  });
}

export async function createConversation(request, env) {
  const body = await request.json();
  const id = crypto.randomUUID();
  const now = Date.now();
  const conv = {
    id, title: "Nueva conversación", folderId: body.folderId || null,
    pinned: false, color: "none", model: body.model || "@cf/zai-org/glm-4.7-flash",
    systemPrompt: body.systemPrompt || "", createdAt: now, updatedAt: now, messages: []
  };
  await writeConv(env, conv);
  await syncIndex(env, conv, "");
  return Response.json(conv);
}

export async function getConversation(env, id) {
  const conv = await readConv(env, id);
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(conv);
}

export async function updateConversation(request, env, id) {
  const body = await request.json();
  const conv = await readConv(env, id);
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
  for (const k of ["title", "folderId", "pinned", "color", "model", "systemPrompt"]) {
    if (body[k] !== undefined) conv[k] = body[k];
  }
  if (body.clearMessages) conv.messages = [];
    if (body.editMessage && conv.messages) {
    const i = body.editMessage.index | 0;
    if (conv.messages[i] && conv.messages[i].role === "user") {
      conv.messages[i].content = body.editMessage.content;
      conv.messages[i].edited = true;
      conv.messages.length = i + 1;
    }
  }
  conv.updatedAt = Date.now();
  await writeConv(env, conv);
  await syncIndex(env, conv, body.clearMessages ? "" : undefined);
  return Response.json({ ok: true });
}

export async function deleteConversation(env, id) {
  await env.R2.delete("conversaciones/conv:" + id);
  const idx = await r2Json(env, CONV_IDX, []);
  await r2PutJson(env, CONV_IDX, idx.filter(c => c.id !== id));
  return Response.json({ ok: true });
}

export async function chat(request, env, id, settings) {
  const body = await request.json();
  const conv = await readConv(env, id);
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });
  const model = body.model || conv.model;
  const ext = settings.modelsExt || [];
  const meta = resolveModel(model, ext);
  if (!meta) return Response.json({ error: "badmodel" }, { status: 400 });
  const incoming = body.messages || [];

  const fidx = await loadFileIndex(env);
  const attached = Object.values(fidx).filter(f => (f.convIds || []).includes(id));
  const wantsImg = (meta.fileTypes || []).includes("image");
  const imgFiles = wantsImg ? attached.filter(f => f.cat === "image") : [];
  const txtFiles = attached.filter(f => f.cat === "text");

  const logical = incoming.map(m => ({ role: m.role, content: m.content }));
  const mp = (settings.modelPrompts || {})[model];
  if (mp) logical.unshift({ role: "system", content: mp });
  if (conv.systemPrompt) logical.unshift({ role: "system", content: conv.systemPrompt });
  if (imgFiles.length && logical.length) {
    const last = logical[logical.length - 1];
    if (last.role === "user") {
      const parts = typeof last.content === "string" ? [{ type: "text", text: last.content }] : (Array.isArray(last.content) ? last.content : []);
      for (const f of imgFiles) {
        const url = await fileToDataUrl(env, f, settings);
        if (url) parts.push({ type: "image_url", image_url: { url } });
      }
      last.content = parts;
    }
  }
  for (const f of txtFiles) {
    const t = await getFileText(env, f.hash, settings);
    if (t) logical.push({ role: "system", content: f.name + ":\n\n" + t.slice(0, 50000) });
  }

  let result;
  try {
    if (isExternal(model)) {
      result = await runExternal(resolveExternal(model, ext), logical);
    } else {
      const hasImg = logical.some(m => Array.isArray(m.content));
      const target = hasImg ? "@cf/meta/llama-3.2-11b-vision-instruct" : model;
      const raw = await env.AI.run(target, { messages: toWire(logical, "cf") });
      result = typeof raw === "string" ? { response: raw } : raw;
    }
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }

  let response = "";
  if (typeof result === "string") response = result;
  else if (result) response = result.response || (result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) || "";

  const today = todayStr();
  let usage;
  if (isExternal(model)) {
    const em = resolveExternal(model, ext);
    const key = "ajustes/usage-ext:" + today;
    const u = await r2Json(env, key, {});
    const cur = u[em.id] || { tokens: 0, messages: 0, tin: 0, tout: 0 };
    if (em.dailyLimit && cur.tokens >= em.dailyLimit) return Response.json({ error: "extlimit" }, { status: 429 });
    const tokens = (result.promptTokens || 0) + (result.completionTokens || 0);
    cur.tokens += tokens; cur.messages += 1; cur.tin += result.promptTokens || 0; cur.tout += result.completionTokens || 0;
    u[em.id] = cur;
    await r2PutJson(env, key, u);
    usage = { ext: em.id, tokens, limit: em.dailyLimit, remaining: em.dailyLimit ? Math.max(0, em.dailyLimit - cur.tokens) : null };
  } else {
    const inTok = Math.ceil(JSON.stringify(logical).length / 4);
    const outTok = Math.ceil(response.length / 4);
    const neurons = estimateNeurons(model, inTok, outTok);
    const key = "conversaciones/usage:" + today;
    const u = await r2Json(env, key, { neurons: 0, messages: 0 });
    u.neurons += neurons; u.messages += 1;
    await r2PutJson(env, key, u);
    usage = u;
  }

  const userMsg = incoming[incoming.length - 1];
  conv.messages.push(
    { role: "user", content: typeof userMsg.content === "string" ? userMsg.content : "", timestamp: Date.now() },
    { role: "assistant", content: response, timestamp: Date.now() }
  );
  conv.updatedAt = Date.now();
  if (conv.title === "Nueva conversación" && conv.messages.length >= 2) {
    const ut = typeof userMsg.content === "string" ? userMsg.content : "";
    conv.title = String(ut).slice(0, 40).replace(/\n/g, " ");
  }
  await writeConv(env, conv);
  await syncIndex(env, conv, response.slice(0, 80));
  return Response.json({ response, usage });
}
