export function getJsGuide() {
  return `
function showGuide() {
  var h = '<h2>' + T.guide_title + ' <button class="modal-close" onclick="closeModal()">✕</button></h2>';
  for (var k in MI) {
    var m = MI[k];
    h += '<div class="model-card"><h3>' + modelIcon(k) + " " + m.name + "</h3>";
    h += '<div class="creator">' + m.creator + " · " + m.year + "</div>";
    h += '<div class="oriented">' + m.oriented + "</div>";
    h += '<div class="files-line">' + T.file_accepts + ": " + (m.fileLabels || "—") + "</div>";
    h += '<div class="label">' + T.strengths + "</div><ul>";
    (m.strengths || []).forEach(function(s) { h += '<li><span class="ok">✓</span> ' + s + "</li>"; });
    h += '</ul><div class="label">' + T.weaknesses + "</div><ul>";
    (m.weaknesses || []).forEach(function(s) { h += '<li><span class="bad">✗</span> ' + s + "</li>"; });
    h += '</ul><div class="stats"><div class="stat">' + T.conv_per_day + ': <b>~' + m.convDay + "</b></div>";
    h += '<div class="stat">' + T.cost_per_msg + ': <b>~' + ((100 * m.nIn + 200 * m.nOut) / 1000000).toFixed(1) + " N/msg</b></div></div></div>";
  }
  if (state.modelsExt && state.modelsExt.length) {
    h += '<div class="section-label" style="padding:12px 0 6px">' + T.group_ext + "</div>";
    state.modelsExt.forEach(function(m) {
      h += '<div class="model-card"><h3>🔌 ' + esc(m.name || m.modelId) + "</h3>";
      h += '<div class="creator">' + esc(m.provider || "") + " · " + esc(m.modelId || "") + "</div>";
      h += '<div class="files-line">' + T.file_accepts + ": " + esc((m.fileTypes || ["text"]).join(" · ")) + "</div>";
      h += '<div class="stats"><div class="stat">' + T.cost_per_msg + ': <b>$' + (m.costIn || 0) + " / $" + (m.costOut || 0) + ' /1M</b></div>';
      h += '<div class="stat">' + (m.dailyLimit ? m.dailyLimit.toLocaleString() + " tok/d" : "∞") + "</div></div></div>";
    });
  }
  h += '<div class="f-info" style="margin-top:12px">' + T.limit_info + "</div>";
  showModal(h);
}
function showNews() {
  api("/api/news").then(function(d) {
    var items = d.items || [];
    state.news = items;
    var read = state.readNews || [];
    var h = '<h2>📢 ' + T.news + '</h2><button class="modal-close" onclick="closeModal()">✕</button>';
    if (!items.length) h += '<div class="f-info">' + T.news_empty + '</div>';
    items.forEach(function(n) {
      var unread = read.indexOf(n.id) < 0;
      h += '<div class="news-item' + (unread ? " unread" : "") + '" data-nid="' + esc(n.id) + '"' + (n.url ? ' data-nurl="' + esc(n.url) + '"' : "") + '>';
      h += '<span style="font-size:18px">' + esc(n.icon) + '</span>';
      h += '<div style="flex:1;min-width:0"><div class="ni-title">' + esc(n.title) + '</div>';
      if (n.subtitle) h += '<div class="ni-sub">' + esc(n.subtitle) + '</div></div>';
      h += '<span class="ni-date">' + (n.date ? new Date(n.date).toLocaleDateString() : "") + '</span></div>';
    });
    h += '<div class="btn-row"><button class="btn-secondary" onclick="markAllNewsRead()">' + T.news_mark_all + '</button></div>';
    showModal(h);
    document.querySelectorAll('#modal-content .news-item').forEach(function(el) {
      el.onclick = function() {
        if (el.dataset.nurl) window.open(el.dataset.nurl, "_blank");
        markNewsRead(el.dataset.nid);
      };
    });
  });
}

function markNewsRead(id) {
  api("/api/news/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id }) }).then(function(d) {
    state.readNews = d.readNews || [];
    showNews(); renderNewsDot();
  });
}
function markAllNewsRead() {
  api("/api/news/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }).then(function(d) {
    state.readNews = d.readNews || [];
    showNews(); renderNewsDot();
  });
}
function renderNewsDot() {
  var el = document.getElementById("news-dot");
  if (!el) return;
  var read = state.readNews || [];
  var unread = (state.news || []).filter(function(n) { return read.indexOf(n.id) < 0; }).length;
  el.style.display = unread ? "block" : "none";
}
`;
}
