import { r2Json, r2PutJson } from "./util.js";

const CONV_IDX = "conversaciones/index:conversations";
const FOLDER_IDX = "conversaciones/index:folders";

export async function importConversations(request, env) {
  const body = await request.json();
  const folderName = String(body.folderName || "Importado").trim().slice(0, 60) || "Importado";
  const convs = Array.isArray(body.conversations) ? body.conversations : [];
  const model = typeof body.model === "string" && body.model ? body.model : "@cf/zai-org/glm-4.7-flash";
  const folders = await r2Json(env, FOLDER_IDX, []);
  let folder = folders.find(f => f.name === folderName && !f.parentId);
  if (!folder) {
    folder = { id: crypto.randomUUID(), name: folderName, color: "none", pinned: false, parentId: null, createdAt: Date.now() };
    folders.push(folder);
    await r2PutJson(env, FOLDER_IDX, folders);
  }
  const idx = await r2Json(env, CONV_IDX, []);
  let created = 0;
  for (const c of convs) {
    const messages = (Array.isArray(c.messages) ? c.messages : [])
      .filter(m => m && m.content && String(m.content).trim())
      .map(m => ({
        role: String(m.role || "").indexOf("assist") >= 0 ? "assistant" : "user",
        content: String(m.content).slice(0, 50000),
        timestamp: m.timestamp || Date.now()
      }));
    if (!messages.length) continue;
    const now = Date.now();
    const cAt = c.createdAt && !isNaN(Date.parse(c.createdAt)) ? Date.parse(c.createdAt) : now;
    const conv = {
      id: crypto.randomUUID(),
      title: String(c.title || "Importada").slice(0, 80),
      folderId: folder.id, pinned: false, color: "none",
      model,
      source: String(c.source || "").slice(0, 40),
      systemPrompt: "",
      createdAt: cAt, updatedAt: now,
      messages
    };
    await env.R2.put("conversaciones/conv:" + conv.id, JSON.stringify(conv));
    idx.unshift({
      id: conv.id, title: conv.title, folderId: folder.id, pinned: false, color: "none",
      model, createdAt: cAt, updatedAt: now,
      preview: String(messages[messages.length - 1].content).slice(0, 80)
    });
    created++;
  }
  if (created) await r2PutJson(env, CONV_IDX, idx);
  return Response.json({ ok: true, created, folder: folder.name });
}
