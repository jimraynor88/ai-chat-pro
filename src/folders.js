import { r2Json, r2PutJson } from "./util.js";

const FOLDER_IDX = "conversaciones/index:folders";
const CONV_IDX = "conversaciones/index:conversations";

export async function createFolder(request, env) {
  const body = await request.json();
  const id = crypto.randomUUID();
  const folder = {
    id, name: body.name || "Nueva carpeta", color: "none", pinned: false,
    parentId: body.parentId || null, createdAt: Date.now()
  };
  const idx = await r2Json(env, FOLDER_IDX, []);
  idx.push(folder);
  await r2PutJson(env, FOLDER_IDX, idx);
  return Response.json(folder);
}

export async function updateFolder(request, env, id) {
  const body = await request.json();
  const idx = await r2Json(env, FOLDER_IDX, []);
  const folder = idx.find(f => f.id === id);
  if (!folder) return Response.json({ error: "notfound" }, { status: 404 });
  if (body.name !== undefined) folder.name = body.name;
  if (body.color !== undefined) folder.color = body.color;
  if (body.pinned !== undefined) folder.pinned = body.pinned;
  if (body.parentId !== undefined) folder.parentId = body.parentId || null;
  await r2PutJson(env, FOLDER_IDX, idx);
  return Response.json({ ok: true });
}

export async function deleteFolder(env, id) {
  const convs = await r2Json(env, CONV_IDX, []);
  const folders = await r2Json(env, FOLDER_IDX, []);
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) { ids.add(f.id); changed = true; }
    }
  }
  if (convs.some(c => c.folderId && ids.has(c.folderId))) {
    return Response.json({ error: "notempty" }, { status: 400 });
  }
  await r2PutJson(env, FOLDER_IDX, folders.filter(f => !ids.has(f.id)));
  return Response.json({ ok: true });
}
