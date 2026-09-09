// Búsqueda en conversaciones

export async function searchConversations(request, env) {
  const body = await request.json();
  const query = (body.query || "").toLowerCase();
  if (query.length < 2) return Response.json([]);
  const idxObj = await env.R2.get("conversaciones/index:conversations");
  const idx = idxObj ? JSON.parse(await idxObj.text()) : [];
  const results = [];
  for (const c of idx) {
    const convObj = await env.R2.get("conversaciones/conv:" + c.id);
    if (!convObj) continue;
    const conv = JSON.parse(await convObj.text());
    for (const m of conv.messages || []) {
      if (m.content && m.content.toLowerCase().includes(query)) {
        const i = m.content.toLowerCase().indexOf(query);
        results.push({ id: c.id, title: c.title, snippet: m.content.slice(Math.max(0, i - 40), i + 80) });
        break;
      }
    }
  }
  return Response.json(results.slice(0, 50));
}
