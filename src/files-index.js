import { loadFileIndex, saveFileIndex } from "./files.js";
import { getExternal } from "./storage-external.js";

export function listFiles(env) {
  return loadFileIndex(env).then(i => Response.json(i));
}

export async function shareFile(request, env) {
  const body = await request.json();
  const hash = body.hash, convId = body.convId;
  if (!hash || !convId) return Response.json({ error: "no" }, { status: 400 });
  const idx = await loadFileIndex(env);
  const e = idx[hash];
  if (!e) return Response.json({ error: "notfound" }, { status: 404 });
  if (!e.convIds) e.convIds = [];
  if (!e.convIds.includes(convId)) e.convIds.push(convId);
  await saveFileIndex(env, idx);
  return Response.json({ ok: true, convIds: e.convIds });
}

export async function detachFile(request, env) {
  const body = await request.json();
  const hash = body.hash, convId = body.convId;
  const idx = await loadFileIndex(env);
  const e = idx[hash];
  if (!e) return Response.json({ ok: true });
  if (e.convIds) e.convIds = e.convIds.filter(c => c !== convId);
  await saveFileIndex(env, idx);
  return Response.json({ ok: true, convIds: e.convIds });
}

export async function getBlob(request, env, hash, settings) {
  const idx = await loadFileIndex(env);
  const e = idx[hash];
  if (!e) return Response.json({ error: "notfound" }, { status: 404 });
  const ct = e.mime || "application/octet-stream";
  let buf;
  if (e.external) {
    buf = await getExternal(settings.storageExt, e.hash, e.url);
  } else {
    const o = await env.R2.get("archivos/data:" + hash);
    if (!o) return Response.json({ error: "gone" }, { status: 410 });
    buf = await o.arrayBuffer();
  }
  const dispo = request.headers.get("X-Download") ? "attachment" : "inline";
  const fn = (e.name || hash).replace(/"/g, "");
  return new Response(buf, {
    headers: {
      "Content-Type": ct,
      "Content-Disposition": dispo + '; filename="' + fn + '"',
      "Cache-Control": "private, max-age=3600"
    }
  });
}
