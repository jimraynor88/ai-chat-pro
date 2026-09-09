export function getJsSidebar() {
  return `
function modelIcon(k) {
  if (k === "@cf/zai-org/glm-4.7-flash") return "⚡";
  if (k === "@cf/google/gemma-4-26b-a4b-it") return "💎";
  if (k === "@cf/meta/llama-3.3-70b-instruct-fp8-fast") return "🦙";
  if (k === "@cf/nvidia/nemotron-3-120b-a12b") return "🟢";
  if (k && k.indexOf("ext:") === 0) return "🔌";
  return "";
}

function convItemHtml(c, depth) {
  var a = state.current && state.current.id === c.id ? " active" : "";
  var p = c.pinned ? " pinned" : "";
  return '<div class="conv-item' + a + p + '" data-id="' + c.id + '" style="padding-left:' + (12 + depth * 14) + 'px">'
    + '<span class="conv-color ' + (c.color || "none") + '"></span>'
    + '<div class="conv-info"><div class="conv-title"><span class="conv-model-icon">' + modelIcon(c.model) + '</span> ' + esc(c.title) + '</div>'
    + '<div class="conv-preview">' + esc(c.preview ? String(c.preview).slice(0, 50) : "") + '</div></div>'
    + '<span class="conv-time">' + fmtTime(c.updatedAt) + '</span>'
    + '<button class="conv-menu-btn">⋯</button></div>';
}

function folderItemHtml(f, depth) {
  var open = state.foldOpen[f.id] !== false;
  var count = state.conversations.filter(function(c) { return c.folderId === f.id; }).length;
  var h = '<div class="folder-item" style="padding-left:' + (12 + depth * 14) + 'px" onclick="toggleFolder(\\'' + f.id + '\\')">';
  h += '<span class="conv-color ' + (f.color || "none") + '"></span>';
  h += '<span class="folder-icon">' + (open ? "▼" : "▶") + '</span>';
  h += '<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (f.pinned ? "📌 " : "") + esc(f.name) + '</span>';
  h += '<span class="folder-count">' + count + '</span>';
  h += '<button class="conv-menu-btn" style="opacity:1" onclick="showFolderMenu(\\'' + f.id + '\\',event)">⋯</button></div>';
  if (open) {
    state.folders.filter(function(x) { return x.parentId === f.id; }).forEach(function(k) { h += folderItemHtml(k, depth + 1); });
    state.conversations.filter(function(c) { return c.folderId === f.id; })
      .sort(function(a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt; })
      .forEach(function(c) { h += convItemHtml(c, depth + 1); });
  }
  return h;
}

function renderSidebar() {
  var gs = document.getElementById("global-search");
  if (gs && gs.value.length >= 2) return;
  var list = document.getElementById("conv-list");
  var h = "";
  var roots = state.folders.filter(function(f) { return !f.parentId; })
    .sort(function(a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || a.name.localeCompare(b.name); });
  if (roots.length) h += '<div class="section-label">' + T.folders + '</div>';
  roots.forEach(function(f) { h += folderItemHtml(f, 0); });
  h += '<div class="section-label">' + T.conversations + '</div>';
  state.conversations.filter(function(c) { return !c.folderId; })
    .sort(function(a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt; })
    .forEach(function(c) { h += convItemHtml(c, 0); });
  if (!state.conversations.length && !state.folders.length) h += '<div class="empty" style="padding:20px 12px;font-size:12px">' + T.no_conversations + '</div>';
  list.innerHTML = h;
  bindConvItems();
}

function bindConvItems() {
  document.getElementById("conv-list").querySelectorAll(".conv-item").forEach(function(item) {
    item.onclick = function(e) { if (e.target.classList.contains("conv-menu-btn")) return; selectConversation(item.dataset.id); };
    var mb = item.querySelector(".conv-menu-btn");
    if (mb) mb.onclick = function(e) { e.stopPropagation(); showCtxMenu(item.dataset.id, e); };
  });
}

function openCtxMenu(h, e) {
  var m = document.getElementById("ctx-menu");
  m.innerHTML = h; m.classList.add("show");
  var w = m.offsetWidth, mh = m.offsetHeight;
  m.style.left = Math.max(4, Math.min(e.clientX, window.innerWidth - w - 4)) + "px";
  m.style.top = Math.max(4, Math.min(e.clientY, window.innerHeight - mh - 4)) + "px";
}

function colorRowHtml(cur, fn, id) {
  var h = "";
  for (var i = 0; i < COLORS.length; i++) {
    var cl = COLORS[i];
    h += '<div class="swatch ' + cl + (cur === cl ? " active" : "") + '" onclick="' + fn + '(\\'' + id + '\\',\\'' + cl + '\\')"></div>';
  }
  return h;
}

function toggleFolder(fid) {
  state.foldOpen[fid] = state.foldOpen[fid] === false ? true : false;
  renderSidebar();
}

function showFolderMenu(fid, e) {
  e.stopPropagation();
  var f = state.folders.find(function(x) { return x.id === fid; });
  if (!f) return;
  var count = state.conversations.filter(function(c) { return c.folderId === fid; }).length;
  var subCount = state.folders.filter(function(x) { return x.parentId === fid; }).length;
  var h = "";
  h += '<button onclick="renameFolder(\\'' + fid + '\\')">✏️ ' + T.rename + '</button>';
  h += '<button onclick="togglePinFolder(\\'' + fid + '\\')">' + (f.pinned ? T.unpin : T.pin) + '</button>';
  h += '<button onclick="newConversationInFolder(\\'' + fid + '\\')">➕ ' + T.new_chat + '</button>';
  h += '<button onclick="newSubFolder(\\'' + fid + '\\')">' + T.new_subfolder + '</button><div class="sep"></div>';
  h += '<div class="hint">' + T.color_label + '</div><div class="color-row">' + colorRowHtml(f.color, "setFolderColor", fid) + '</div><div class="sep"></div>';
  if (count === 0 && subCount === 0) h += '<button onclick="deleteFolder(\\'' + fid + '\\')" style="color:var(--red)">🗑 ' + T.delete + '</button>';
  else h += '<div class="hint">' + (count + subCount) + ' ' + T.conversations.toLowerCase() + '</div>';
  openCtxMenu(h, e);
}

function togglePinFolder(fid) {
  closeCtxMenu();
  var f = state.folders.find(function(x) { return x.id === fid; });
  if (!f) return;
  api("/api/folder/" + fid + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !f.pinned }) }).then(fetchState);
}
function setFolderColor(fid, color) {
  closeCtxMenu();
  api("/api/folder/" + fid + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ color: color }) }).then(fetchState);
}
function renameFolder(fid) {
  closeCtxMenu();
  var f = state.folders.find(function(x) { return x.id === fid; });
  if (!f) return;
  showModal('<h2>' + T.rename + '</h2><button class="modal-close" onclick="closeModal()">✕</button><input type="text" class="input-prompt" id="rfn" value="' + esc(f.name).replace(/"/g, "&quot;") + '"><div class="btn-row"><button class="btn-primary" onclick="doRenameFolder(\\'' + fid + '\\')">' + T.save + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + '</button></div>');
  setTimeout(function() { var i = document.getElementById("rfn"); i.focus(); i.select(); }, 50);
}
function doRenameFolder(fid) {
  var n = document.getElementById("rfn").value.trim();
  if (!n) return;
  api("/api/folder/" + fid + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) }).then(function() { fetchState(); closeModal(); });
}
function newSubFolder(fid) {
  closeCtxMenu();
  showModal('<h2>' + T.new_subfolder + '</h2><button class="modal-close" onclick="closeModal()">✕</button><input type="text" class="input-prompt" id="nsfn" placeholder="' + T.folder_name_placeholder + '" onkeydown="if(event.key===\\'Enter\\')doNewSubFolder(\\'' + fid + '\\')"><div class="btn-row"><button class="btn-primary" onclick="doNewSubFolder(\\'' + fid + '\\')">' + T.create + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + '</button></div>');
  setTimeout(function() { document.getElementById("nsfn").focus(); }, 50);
}
function doNewSubFolder(fid) {
  var n = document.getElementById("nsfn").value.trim();
  if (!n) return;
  api("/api/folder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n, parentId: fid }) }).then(function() { fetchState(); closeModal(); });
}
function deleteFolder(fid) {
  closeCtxMenu();
  if (!confirm(T.delete_confirm)) return;
  api("/api/folder/" + fid + "/delete", { method: "POST" }).then(function(r) {
    if (r.error) alert(T.folder_not_empty);
    else fetchState();
  });
}

function newConversation() {
  api("/api/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: document.getElementById("model").value }) }).then(function(conv) {
    state.current = conv;
    document.getElementById("model").value = conv.model;
    syncAccept();
    fetchState().then(function() { renderChat(); renderChips(); if (isMobile()) closeMobileSidebar(); });
  });
}
function newConversationInFolder(fid) {
  closeCtxMenu();
  api("/api/conversation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: document.getElementById("model").value, folderId: fid }) }).then(function(conv) {
    state.current = conv;
    fetchState().then(function() { renderChat(); renderChips(); });
  });
}

function selectConversation(id) {
  api("/api/conversation/" + id + "/get").then(function(conv) {
    state.current = conv;
    document.getElementById("model").value = conv.model || "@cf/zai-org/glm-4.7-flash";
    syncAccept();
    renderSidebar(); renderChat(); renderChips();
    if (isMobile()) closeMobileSidebar();
  });
}

function togglePin(id) {
  closeCtxMenu();
  var c = state.conversations.find(function(x) { return x.id === id; });
  if (!c) return;
  api("/api/conversation/" + id + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !c.pinned }) }).then(fetchState);
}
function setColor(id, color) {
  closeCtxMenu();
  api("/api/conversation/" + id + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ color: color }) }).then(fetchState);
}
function deleteConversation(id) {
  closeCtxMenu();
  if (!confirm(T.delete_confirm)) return;
  api("/api/conversation/" + id + "/delete", { method: "POST" }).then(function() {
    if (state.current && state.current.id === id) state.current = null;
    fetchState().then(renderChat);
  });
}
function renameConversation(id) {
  closeCtxMenu();
  var c = state.conversations.find(function(x) { return x.id === id; });
  if (!c) return;
  showModal('<h2>' + T.rename_title + '</h2><button class="modal-close" onclick="closeModal()">✕</button><input type="text" class="input-prompt" id="rn" value="' + esc(c.title).replace(/"/g, "&quot;") + '"><div class="btn-row"><button class="btn-primary" onclick="doRename(\\'' + id + '\\')">' + T.save + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + '</button></div>');
  setTimeout(function() { var i = document.getElementById("rn"); i.focus(); i.select(); }, 50);
}
function doRename(id) {
  var n = document.getElementById("rn").value.trim();
  if (!n) return;
  api("/api/conversation/" + id + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: n }) }).then(function() { fetchState(); closeModal(); });
}

function descIds(fid) {
  var out = [];
  state.folders.filter(function(x) { return x.parentId === fid; }).forEach(function(k) { out.push(k.id); out = out.concat(descIds(k.id)); });
  return out;
}
function moveOptsHtml(indent, skipId, desc) {
  var h = "";
  state.folders.filter(function(f) { return !f.parentId && f.id !== skipId; }).forEach(function(f) {
    var dis = desc.indexOf(f.id) >= 0 ? " disabled" : "";
    h += '<option value="' + f.id + '"' + dis + '>' + indent + esc(f.name) + '</option>';
    state.folders.filter(function(x) { return x.parentId === f.id && x.id !== skipId; }).forEach(function(k) {
      var d2 = desc.indexOf(k.id) >= 0 ? " disabled" : "";
      h += '<option value="' + k.id + '"' + d2 + '>' + indent + "└ " + esc(k.name) + '</option>';
      h += moveOptsChildren(k.id, indent + "    ", skipId, desc);
    });
  });
  return h;
}
function moveOptsChildren(fid, indent, skipId, desc) {
  var h = "";
  state.folders.filter(function(x) { return x.parentId === fid && x.id !== skipId; }).forEach(function(k) {
    var dis = desc.indexOf(k.id) >= 0 ? " disabled" : "";
    h += '<option value="' + k.id + '"' + dis + '>' + indent + "└ " + esc(k.name) + '</option>';
    h += moveOptsChildren(k.id, indent + "    ", skipId, desc);
  });
  return h;
}
function moveToFolder(id) {
  closeCtxMenu();
  var c = state.conversations.find(function(x) { return x.id === id; });
  var skip = c && c.folderId ? c.folderId : null;
  var desc = skip ? descIds(skip) : [];
  var opts = '<option value="">' + T.no_folder + '</option>' + moveOptsHtml("", skip, desc);
  opts += '<option value="__new__">➕ ' + T.new_folder + '</option>';
  showModal('<h2>' + T.move_title + '</h2><button class="modal-close" onclick="closeModal()">✕</button><select class="folder-select" id="fs">' + opts + '</select><input type="text" class="input-prompt" id="newfolder-name" style="display:none" placeholder="' + T.folder_name_placeholder + '"><div class="btn-row"><button class="btn-primary" onclick="doMove(\\'' + id + '\\')">' + T.move + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + '</button></div>');
  document.getElementById("fs").onchange = function() {
    document.getElementById("newfolder-name").style.display = this.value === "__new__" ? "block" : "none";
  };
}
function doMove(id) {
  var fid = document.getElementById("fs").value;
  if (fid === "__new__") {
    var nn = document.getElementById("newfolder-name").value.trim();
    if (!nn) return;
    api("/api/folder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nn }) }).then(function(folder) {
      api("/api/conversation/" + id + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: folder.id }) }).then(function() { fetchState(); closeModal(); });
    });
  } else {
    api("/api/conversation/" + id + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: fid || null }) }).then(function() { fetchState(); closeModal(); });
  }
}
function createFolderPrompt() {
  closeCtxMenu();
  showModal('<h2>' + T.new_folder + '</h2><button class="modal-close" onclick="closeModal()">✕</button><input type="text" class="input-prompt" id="fn" placeholder="' + T.folder_name_placeholder + '" onkeydown="if(event.key===\\'Enter\\')doCreateFolder()"><div class="btn-row"><button class="btn-primary" onclick="doCreateFolder()">' + T.create + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + '</button></div>');
  setTimeout(function() { document.getElementById("fn").focus(); }, 50);
}
function doCreateFolder() {
  var n = document.getElementById("fn").value.trim();
  if (!n) return;
  api("/api/folder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) }).then(function() { fetchState(); closeModal(); });
}

function showCtxMenu(id, e) {
  var c = state.conversations.find(function(x) { return x.id === id; });
  if (!c) return;
  var h = "";
  h += '<button onclick="renameConversation(\\'' + id + '\\')">✏️ ' + T.rename + '</button>';
  h += '<button onclick="togglePin(\\'' + id + '\\')">' + (c.pinned ? T.unpin : T.pin) + '</button>';
  h += '<button onclick="moveToFolder(\\'' + id + '\\')">📁 ' + T.move_folder + '</button>';
  h += '<button onclick="setSystemPrompt(\\'' + id + '\\')">🗣 ' + T.system_prompt + '</button>';
  h += '<button onclick="exportConversation(\\'' + id + '\\')">' + T.export_short + '</button><div class="sep"></div>';
  h += '<div class="hint">' + T.color_label + '</div><div class="color-row">' + colorRowHtml(c.color, "setColor", id) + '</div><div class="sep"></div>';
  h += '<button onclick="createFolderPrompt()" style="color:var(--accent)">' + T.new_folder + '</button>';
  h += '<button onclick="deleteConversation(\\'' + id + '\\')" style="color:var(--red)">🗑 ' + T.delete + '</button>';
  openCtxMenu(h, e);
}

function doGlobalSearch(q) {
  if (q.length < 2) { renderSidebar(); return; }
  api("/api/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) }).then(function(results) {
    var list = document.getElementById("conv-list");
    var h = '<div class="section-label">' + results.length + '</div>';
    if (!results.length) h += '<div class="empty" style="padding:20px 12px;font-size:12px">—</div>';
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      h += '<div class="search-result" onclick="selectConversation(\\'' + r.id + '\\')"><div class="sr-title">' + esc(r.title) + '</div><div class="sr-snippet">' + highlight(r.snippet, q) + '</div></div>';
    }
    list.innerHTML = h;
  });
}

function bmTreeHtml(parentId, depth) {
  var h = "";
  state.bookmarks.filter(function(b) { return (b.parentId || null) === parentId; })
    .sort(function(a, b) { return (a.order || 0) - (b.order || 0); })
    .forEach(function(b) {
      h += '<div class="bm-item' + (depth ? " sub" : "") + '" onclick="window.open(\\'' + esc(b.url) + '\\',\\'_blank\\')">';
      h += '<span class="bm-name">' + esc(b.name) + '</span>';
      h += '<span class="bm-url">' + esc(String(b.url).replace(/^https?:\\/\\//, "")) + '</span>';
      h += '<button style="background:none;color:var(--muted);font-size:12px" onclick="event.stopPropagation();bmEdit(\\'' + b.id + '\\')">✏️</button></div>';
      h += bmTreeHtml(b.id, depth + 1);
    });
  return h;
}
function renderBookmarks() {
  var sec = document.getElementById("bm-section");
  var sb = document.getElementById("bm-sidebar-list");
  if (!state.bookmarks.length) { sec.style.display = "none"; sb.innerHTML = ""; return; }
  sec.style.display = "block";
  sb.innerHTML = bmTreeHtml(null, 0);
}
function toggleBmDrop() {
  var d = document.getElementById("bm-drop");
  d.classList.toggle("show");
  if (d.classList.contains("show")) {
    d.innerHTML = (state.bookmarks.length ? bmTreeHtml(null, 0) : '<div class="hint" style="padding:8px 10px;font-size:12px;color:var(--muted)">' + T.bookmarks_empty + '</div>')
      + '<div class="sep"></div><button class="bm-mgr" onclick="bmAddPrompt(null)">➕ ' + T.bookmarks_add + '</button>';
  }
}
function bmForm(parentId, bm) {
  var opts = '<option value="">' + T.bm_root + '</option>';
  state.bookmarks.filter(function(b) { return b.id !== (bm && bm.id); }).forEach(function(b) {
    opts += '<option value="' + b.id + '"' + (parentId === b.id ? " selected" : "") + '>' + esc(b.name) + '</option>';
  });
  var del = bm ? '<button class="btn-secondary" style="margin-left:auto;color:var(--red)" onclick="bmDelete(\\'' + bm.id + '\\')">🗑</button>' : "";
  return '<h2>' + (bm ? T.bookmarks_edit : T.bookmarks_add) + '</h2><button class="modal-close" onclick="closeModal()">✕</button>'
    + '<label class="f-label">' + T.bm_name + '</label><input type="text" class="input-prompt" id="bm-name" value="' + esc(bm ? bm.name : "") + '">'
    + '<label class="f-label">' + T.bm_url + '</label><input type="text" class="input-prompt" id="bm-url" value="' + esc(bm ? bm.url : "") + '">'
    + '<label class="f-label">' + T.bm_parent + '</label><select class="folder-select" id="bm-parent">' + opts + '</select>'
    + '<div class="btn-row"><button class="btn-primary" onclick="doBmSave(\\'' + (bm ? bm.id : "") + '\\')">' + (bm ? T.save : T.create) + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + '</button>' + del + '</div>';
}
function bmAddPrompt(parentId) {
  document.getElementById("bm-drop").classList.remove("show");
  showModal(bmForm(parentId, null));
  setTimeout(function() { document.getElementById("bm-name").focus(); }, 50);
}
function bmEdit(id) {
  var bm = state.bookmarks.find(function(b) { return b.id === id; });
  if (!bm) return;
  document.getElementById("bm-drop").classList.remove("show");
  showModal(bmForm(bm.parentId || null, bm));
}
function doBmSave(id) {
  var name = document.getElementById("bm-name").value.trim();
  var url = document.getElementById("bm-url").value.trim();
  var parentId = document.getElementById("bm-parent").value || null;
  if (!name || !url) return;
  if (!/^https?:\\/\\//i.test(url)) url = "https://" + url;
  var body = JSON.stringify({ name: name, url: url, parentId: parentId });
  if (id) api("/api/bookmark/" + id + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: body }).then(loadBm);
  else api("/api/bookmark", { method: "POST", headers: { "Content-Type": "application/json" }, body: body }).then(loadBm);
}
function loadBm() {
  api("/api/bookmarks").then(function(a) {
    state.bookmarks = a;
    renderBookmarks();
    closeModal();
  });
}
function bmDelete(id) {
  if (!confirm(T.delete_confirm)) return;
  api("/api/bookmark/" + id + "/delete", { method: "POST" }).then(loadBm);
}
`;
}
