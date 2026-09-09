function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function stamp(ts) {
  return new Date(ts).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function exportTxt(conv) {
  let out = (conv.title || "Conversación") + "\n" + "=".repeat(40) + "\n\n";
  for (const m of conv.messages || []) {
    out += "[" + (m.role === "user" ? "Tú" : "IA") + " · " + stamp(m.timestamp) + "]\n" + String(m.content) + "\n\n";
  }
  return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": 'attachment; filename="conversacion.txt"' } });
}

export function exportMd(conv) {
  let out = "# " + (conv.title || "Conversación") + "\n\n";
  for (const m of conv.messages || []) {
    const who = m.role === "user" ? "### 👤 Tú" : "### 🤖 IA";
    out += who + " — `" + stamp(m.timestamp) + "`\n\n" + String(m.content) + "\n\n";
  }
  return new Response(out, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="conversacion.md"' } });
}

export function exportHtml(conv) {
  const msgs = (conv.messages || []).map(m => {
    const cls = m.role === "user" ? "user" : "ai";
    return '<div class="msg ' + cls + '"><div class="meta">' + (m.role === "user" ? "👤" : "🤖") + " " + stamp(m.timestamp) + '</div><div class="body">' + esc(m.content) + '</div></div>';
  }).join("\n");
  const html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(conv.title || "Conversación") + '</title><style>' +
    'body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1a1a1a;background:#fafafa}' +
    'h1{font-size:22px;border-bottom:2px solid #f6821f;padding-bottom:8px}' +
    '.msg{background:#fff;border:1px solid #e2e2e2;border-radius:12px;padding:12px 16px;margin:12px 0}' +
    '.msg.user{margin-left:60px;background:#fff7f0}' +
    '.meta{font-size:11px;color:#888;margin-bottom:6px}' +
    '.body{white-space:pre-wrap;line-height:1.6;font-size:14px}' +
    '@media print{.msg{break-inside:avoid}}' +
    '</style></head><body><h1>' + esc(conv.title || "Conversación") + '</h1>' + msgs +
    '<script>window.onload=function(){if(new URLSearchParams(location.search).has("pdf"))window.print()};<\/script>' +
    '</body></html>';
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
