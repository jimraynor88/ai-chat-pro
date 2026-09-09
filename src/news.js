const NEWS_URL = "https://raw.githubusercontent.com/jimraynor88/news/main/news.json";
let _cache = { items: [], at: 0 };
const TTL = 6000000;

export async function getNews() {
  const now = Date.now();
  if (now - _cache.at < TTL) return _cache.items;
  try {
    const r = await fetch(NEWS_URL, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    const raw = Array.isArray(d) ? d : (Array.isArray(d.items) ? d.items : []);
    _cache = {
      items: raw.slice(0, 50).map(n => ({
        id: String(n.id || n.title || ""),
        title: String(n.title || ""),
        subtitle: String(n.subtitle || ""),
        date: n.date || null,
        icon: String(n.icon || "📢"),
        url: n.url || null
      })).filter(n => n.id && n.title),
      at: now
    };
    return _cache.items;
  } catch (e) {
    return _cache.items.length ? _cache.items : [];
  }
}
