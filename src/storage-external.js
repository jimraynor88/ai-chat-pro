import { sha256Hex, toHex } from "./util.js";

const EMPTY = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

function b64basic(st) {
  const s = (st.user || "") + ":" + (st.pass || "");
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return "Basic " + btoa(bin);
}

function cleanBucket(st) {
  return String(st.bucket || "").replace(/^\/+|\/+$/g, "");
}

async function s3Auth(st, method, path, payloadHash) {
  const region = st.region || "auto";
  const now = new Date();
  const amz = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const date = amz.slice(0, 8);
  const host = new URL(st.endpoint).host;
  const ch = "host:" + host + "\nx-amz-content-sha256:" + payloadHash + "\nx-amz-date:" + amz + "\n";
  const sh = "host;x-amz-content-sha256;x-amz-date";
  const cr = method + "\n" + path + "\n\n" + ch + "\n" + sh + "\n" + payloadHash;
  const scope = date + "/" + region + "/s3/aws4_request";
  const s2s = "AWS4-HMAC-SHA256\n" + amz + "\n" + scope + "\n" + (await sha256Hex(new TextEncoder().encode(cr)));
  const enc = new TextEncoder();
  let k = await crypto.subtle.importKey("raw", enc.encode("AWS4" + st.secretKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  let k1 = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(date)));
  k = await crypto.subtle.importKey("raw", k1, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  k1 = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(region)));
  k = await crypto.subtle.importKey("raw", k1, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  k1 = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode("s3")));
  k = await crypto.subtle.importKey("raw", k1, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = toHex(await crypto.subtle.sign("HMAC", k, enc.encode(s2s)));
  return {
    amz,
    auth: "AWS4-HMAC-SHA256 Credential=" + st.accessKey + "/" + scope + ", SignedHeaders=" + sh + ", Signature=" + sig
  };
}

async function s3Req(st, method, key, body, contentType) {
  const path = "/" + cleanBucket(st) + "/" + key;
  const ph = body ? await sha256Hex(new Uint8Array(body)) : EMPTY;
  const { amz, auth } = await s3Auth(st, method, path, ph);
  const url = st.endpoint.replace(/\/+$/, "") + path;
  const headers = { "x-amz-date": amz, "x-amz-content-sha256": ph, Authorization: auth };
  if (body) headers["Content-Type"] = contentType || "application/octet-stream";
  return fetch(url, { method, headers, body: body || undefined });
}

function webdavUrl(st, key) {
  return st.endpoint.replace(/\/+$/, "") + (st.bucket ? "/" + cleanBucket(st) : "") + "/" + key;
}

async function webdavPut(st, key, data, contentType) {   // SÍ async
  const url = webdavUrl(st, key);
  const r = await fetch(url, {                                       // SÍ await
    method: "PUT",
    headers: { Authorization: b64basic(st), "Content-Type": contentType || "application/octet-stream" },
    body: data
  });
  if (!r.ok) throw new Error("webdav " + r.status);
  return url;
}

export async function putExternal(st, key, data, contentType) {
  if (!st || st.type === "off" || !st.endpoint) throw new Error("storage off");
  if (st.type === "webdav") return webdavPut(st, key, data, contentType);
  const r = await s3Req(st, "PUT", key, data, contentType);
  if (!r.ok) throw new Error("s3 " + r.status);
  return st.publicUrl ? st.publicUrl.replace(/\/+$/, "") + "/" + key : null;
}

export async function getExternal(st, key, url) {
  let r;
  if (st.type === "webdav") {
    r = await fetch(url, { headers: { Authorization: b64basic(st) } });
  } else if (st.publicUrl && url) {
    r = await fetch(url);
  } else {
    r = await s3Req(st, "GET", key);
  }
  if (!r.ok) throw new Error("get " + r.status);
  return r.arrayBuffer();
}

export async function deleteExternal(st, key, url) {
  if (st.type === "webdav") {
    const r = await fetch(url, { method: "DELETE", headers: { Authorization: b64basic(st) } });
    if (!r.ok && r.status !== 404) throw new Error("webdav " + r.status);
    return;
  }
  const r = await s3Req(st, "DELETE", key);
  if (!r.ok && r.status !== 404) throw new Error("s3 " + r.status);
}

export async function testExternal(st) {
  if (!st || st.type === "off" || !st.endpoint) return { ok: false, status: 0 };
  try {
    if (st.type === "webdav") {
      const url = st.endpoint.replace(/\/+$/, "") + (st.bucket ? "/" + cleanBucket(st) : "");
      const r = await fetch(url, { method: "HEAD", headers: { Authorization: b64basic(st) } });
      return { ok: r.status < 500, status: r.status };
    }
    const r = await s3Req(st, "HEAD", "");
    return { ok: r.status === 200 || r.status === 403, status: r.status };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}
