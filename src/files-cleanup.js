import { loadFileIndex, saveFileIndex } from "./files.js";
import { deleteExternal } from "./storage-external.js";

export async function runCleanup(env, settings) {
  const days = settings.retention || 0;
  if (!days) return { removed: 0 };
  const cutoff = Date.now() - days * 86400000;
  const idx = await loadFileIndex(env);
  let removed = 0;
  const st = settings.storageExt;
  for (const hash of Object.keys(idx)) {
    const e = idx[hash];
    if (e.createdAt < cutoff) {
      if (e.external) {
        try { await deleteExternal(st, e.hash, e.url); } catch (err) { }
      } else {
        await env.R2.delete("archivos/data:" + hash);
      }
      delete idx[hash];
      removed++;
    }
  }
  if (removed) await saveFileIndex(env, idx);
  return { removed };
}
