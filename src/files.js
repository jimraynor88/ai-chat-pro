import { fileCategory, modelAcceptsFile } from "./models.js";
import { putExternal, getExternal } from "./storage-external.js";
import { sha256Hex } from "./util.js";

const IDX = "archivos/index:files";
const MAX_SIZE = 25 * 1024 * 1024;

export async function loadFileIndex(env) {
  const o = await env.R2.get(IDX);
  return o ? JSON.parse(await o.text()) : {};
}

export async function saveFileIndex(env, idx) {
  await env.R2.put(IDX, JSON.stringify(idx));
}

async function readBlob(env, entry, settings) {
  if (entry.external) return getExternal(settings.storageExt, entry.hash, entry.url);
  const o = await env.R2.get("archivos/data:" + entry.hash);
  return o ? o.arrayBuffer() : null;
}

export async function getFileText(env, hash, settings) {
  const idx = await loadFileIndex(env);
  const e = idx[hash];
  if (!e || e.cat !== "text") return null;
  try {
    const b = await readBlob(env, e, settings);
    return b ? new TextDecoder().decode(b).slice(0, 100000) : null;
  } catch (err) {
    return null;
  }
}

export async function uploadFile(request, env, settings, modelKey, convId) {
  try {
    const fd = await request.formData();
    const file = fd.get("file");
    if (!file) return Response.json({ error: "type:no" }, { status: 400 });
    const name = file.name, mime = file.type || "", size = file.size;
    const cat = fileCategory(name, mime);
    if (!cat) return Response.json({ error: "type:unknown" }, { status: 400 });
    if (size > MAX_SIZE) return Response.json({ error: "type:toobig" }, { status: 400 });
    if (modelKey && !modelAcceptsFile(modelKey, name, mime, settings.modelsExt)) {
      return Response.json({ error: "type:blocked" }, { status: 400 });
    }
    const buf = await file.arrayBuffer();
    const hash = await sha256Hex(buf);
    const idx = await loadFileIndex(env);
    if (idx[hash]) {
      const e = idx[hash];
      const text = e.cat === "text" ? await getFileText(env, hash, settings) : null;
      return Response.json({ hash, filename: name, size, type: cat, dup: true, text });
    }
    const st = settings.storageExt;
    const entry = { hash, name, size, mime, cat, createdAt: Date.now(), external: false, url: null, convIds: convId ? [convId] : [] };    if (st && st.type !== "off" && st.endpoint) {
      try {
        entry.url = await putExternal(st, hash, buf, mime);
        entry.external = true;
      } catch (err) {
        entry.external = false;
      }
    }
    if (!entry.external) {
      await env.R2.put("archivos/data:" + hash, buf, {
        httpMetadata: { contentType: mime },
        customMetadata: { originalName: name }
      });
    }
    idx[hash] = entry;
    await saveFileIndex(env, idx);
    const text = cat === "text" ? new TextDecoder().decode(buf).slice(0, 100000) : null;
    return Response.json({ hash, filename: name, size, type: cat, dup: false, text });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
