const KEY = "bookmarks/index.json";

export async function loadBookmarks(env) {
  const o = await env.R2.get(KEY);
  return o ? JSON.parse(await o.text()) : [];
}

export async function saveBookmarks(env, arr) {
  await env.R2.put(KEY, JSON.stringify(arr));
}

export async function addBookmark(request, env) {
  const body = await request.json();
  const arr = await loadBookmarks(env);
  const bm = {
    id: crypto.randomUUID(),
    name: body.name || "Enlace",
    url: body.url || "",
    parentId: body.parentId || null,
    order: arr.length
  };
  arr.push(bm);
  await saveBookmarks(env, arr);
  return Response.json(bm);
}

export async function updateBookmark(request, env, id) {
  const body = await request.json();
  const arr = await loadBookmarks(env);
  const bm = arr.find(b => b.id === id);
  if (!bm) return Response.json({ error: "notfound" }, { status: 404 });
  if (body.name !== undefined) bm.name = body.name;
  if (body.url !== undefined) bm.url = body.url;
  if (body.parentId !== undefined) bm.parentId = body.parentId;
  if (body.order !== undefined) bm.order = body.order;
  await saveBookmarks(env, arr);
  return Response.json({ ok: true });
}

export async function deleteBookmark(env, id) {
  let arr = await loadBookmarks(env);
  const ids = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const b of arr) {
      if (b.parentId && ids.has(b.parentId)) { ids.add(b.id); changed = true; }
    }
  }
  arr = arr.filter(b => !ids.has(b.id));
  await saveBookmarks(env, arr);
  return Response.json({ ok: true, removed: ids.size });
}

export function listBookmarks(env) {
  return loadBookmarks(env).then(a => Response.json(a));
}
