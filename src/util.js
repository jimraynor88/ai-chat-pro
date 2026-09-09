export async function sha256Hex(data) {
  const buf = await crypto.subtle.digest("SHA-256", data);
  return toHex(buf);
}

export function toHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function r2Json(env, key, fallback) {
  const o = await env.R2.get(key);
  if (!o) return fallback;
  try { return JSON.parse(await o.text()); } catch (e) { return fallback; }
}

export async function r2PutJson(env, key, val) {
  await env.R2.put(key, JSON.stringify(val));
}
