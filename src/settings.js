const KEY = "ajustes/config.json";

export const DEFAULT_SETTINGS = {
  retention: 0,
  defaultModel: "",
  modelPrompts: {},
  readNews: [],
  storageExt: { type: "off", endpoint: "", region: "auto", bucket: "", accessKey: "", secretKey: "", user: "", pass: "", publicUrl: "" },
  modelsExt: []
};

const EX_MAP = {
  EX_ST_TYPE: ["storageExt", "type"],
  EX_ST_ENDPOINT: ["storageExt", "endpoint"],
  EX_ST_REGION: ["storageExt", "region"],
  EX_ST_BUCKET: ["storageExt", "bucket"],
  EX_ST_AK: ["storageExt", "accessKey"],
  EX_ST_SK: ["storageExt", "secretKey"],
  EX_ST_USER: ["storageExt", "user"],
  EX_ST_PASS: ["storageExt", "pass"],
  EX_ST_URL: ["storageExt", "publicUrl"]
};

let _cache = { etag: null, data: null };

function b64toBuf(b64) {
  const bin = atob(b64);
  const b = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return b.buffer;
}

function bufToB64(buf) {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}

async function deriveKey(password, salt) {
  const ek = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    ek,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function normalize(parsed) {
  const cfg = { ...DEFAULT_SETTINGS, ...(parsed || {}) };
  cfg.storageExt = { ...DEFAULT_SETTINGS.storageExt, ...(parsed && parsed.storageExt) };
  cfg.modelsExt = Array.isArray(parsed && parsed.modelsExt) ? parsed.modelsExt : [];
  if (![0, 1, 7, 14, 30, 183, 365].includes(cfg.retention)) cfg.retention = 0;
  cfg.defaultModel = typeof cfg.defaultModel === "string" ? cfg.defaultModel : "";
  cfg.modelPrompts = cfg.modelPrompts && typeof cfg.modelPrompts === "object" ? cfg.modelPrompts : {};
  cfg.readNews = Array.isArray(cfg.readNews) ? cfg.readNews : [];  // ← NUEVA
  return cfg;
}

function withEnv(cfg, env) {
  const out = { ...cfg, storageExt: { ...cfg.storageExt } };
  for (const [sk, path] of Object.entries(EX_MAP)) {
    const v = env[sk];
    if (v) out[path[0]][path[1]] = v;
  }
  return out;
}

async function decryptConfig(env, o) {
  const secret = env.AUTH_SECRET || "";
  if (!secret) {
    try { return JSON.parse(await o.text()); } catch (e) { return null; }
  }
  try {
    const raw = JSON.parse(await o.text());
    if (!raw.data) return null;
    const key = await deriveKey(secret, b64toBuf(raw.salt));
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64toBuf(raw.iv) }, key, b64toBuf(raw.data));
    return JSON.parse(new TextDecoder().decode(plain));
  } catch (e) {
    return null;
  }
}

export async function loadSettings(env) {
  const o = await env.R2.get(KEY);
  if (!o) return withEnv(normalize(null), env);
  const etag = o.httpEtag || null;
  if (_cache.data && _cache.etag === etag) return withEnv(_cache.data, env);
  _cache = { etag, data: normalize(await decryptConfig(env, o)) };
  return withEnv(_cache.data, env);
}

export async function saveSettings(env, cfg) {
  const clean = normalize(cfg);
  const secret = env.AUTH_SECRET || "";
  if (!secret) {
    await env.R2.put(KEY, JSON.stringify(clean));
    _cache = { etag: null, data: null };
    return clean;
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret, salt);
  const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(clean)));
  await env.R2.put(KEY, JSON.stringify({ v: 1, salt: bufToB64(salt), iv: bufToB64(iv), data: bufToB64(enc) }));
  _cache = { etag: null, data: null };
  return clean;
}
