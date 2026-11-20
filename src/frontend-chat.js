export function getJsChat() {
  return `
function typingEl() {
  var t = document.createElement("div");
  t.className = "typing";
  t.innerHTML = "<span>●</span><span>●</span><span>●</span>";
  return t;
}

function addMsg(role, text) {
  var chat = document.getElementById("chat");
  if (chat.querySelector(".empty")) chat.innerHTML = "";
  var d = document.createElement("div");
  d.className = "msg " + role;
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

function msgHtml(m, i) {
  var r = m.role === "user" ? "user" : (m.role === "system" ? "system" : "ai");
  var acts = "";
  if (r === "user") acts = '<button class="msg-act" onclick="editMsg(' + i + ')">' + T.edit + '</button><button class="msg-act" onclick="copyMsg(' + i + ')">' + T.copy + '</button>';
  else if (r === "ai") acts = '<button class="msg-act" onclick="copyMsg(' + i + ')">' + T.copy + '</button><button class="msg-act" onclick="regenMsg(' + i + ')">' + T.regen + '</button>';
  return '<div class="msg ' + r + '" data-i="' + i + '"><div class="msg-meta">' + acts + "<span>" + fmtDateTime(m.timestamp) + "</span></div>" + esc(m.content) + "</div>";
}

function renderChat() {
  var chat = document.getElementById("chat");
  if (!state.current || !state.current.messages || !state.current.messages.length) {
    chat.innerHTML = '<div class="empty">' + T.empty_chat_msg + "</div>";
    return;
  }
  var h = "";
  for (var i = 0; i < state.current.messages.length; i++) h += msgHtml(state.current.messages[i], i);
  h += '<div id="chat-files" class="file-chips" style="padding:4px 0"></div>';
  chat.innerHTML = h;
  chat.scrollTop = chat.scrollHeight;
  renderChatFiles();
}

function renderChatFiles() {
  var el = document.getElementById("chat-files");
  if (!el || !state.current || !state.files) return;
  var list = Object.keys(state.files).filter(function(h) {
    var f = state.files[h];
    return f.convIds && f.convIds.indexOf(state.current.id) >= 0;
  });
  el.innerHTML = list.map(function(h) {
    var f = state.files[h];
    var ic = f.cat === "image" ? "🖼" : f.cat === "pdf" ? "📄" : f.cat === "zip" ? "🗜" : "📃";
    return '<span class="file-chip" title="' + esc(f.name) + '">' + ic + " " + esc(f.name) + "</span>";
  }).join("");
}

function highlight(text, q) {
  var e = esc(text);
  var ql = esc(q).toLowerCase();
  var el = e.toLowerCase();
  var result = "";
  var lastIdx = 0;
  var idx = el.indexOf(ql);
  while (idx >= 0) {
    result += e.substring(lastIdx, idx) + "<mark>" + e.substring(idx, idx + ql.length) + "</mark>";
    lastIdx = idx + ql.length;
    idx = el.indexOf(ql, lastIdx);
  }
  result += e.substring(lastIdx);
  return result;
}

function doInSearch(q) {
  var chat = document.getElementById("chat");
  if (!state.current || !q) { document.getElementById("in-search-count").textContent = ""; renderChat(); return; }
  var cnt = 0;
  var h = "";
  for (var i = 0; i < state.current.messages.length; i++) {
    var m = state.current.messages[i];
    var r = m.role === "user" ? "user" : (m.role === "system" ? "system" : "ai");
    var c = String(m.content == null ? "" : m.content);
    if (c.toLowerCase().indexOf(q.toLowerCase()) >= 0) { cnt++; h += '<div class="msg ' + r + '">' + highlight(c, q) + "</div>"; }
    else h += '<div class="msg ' + r + '">' + esc(c) + "</div>";
  }
  chat.innerHTML = h;
  document.getElementById("in-search-count").textContent = cnt + " " + T.matches;
}

function toggleInSearch() {
  var b = document.getElementById("in-search");
  b.classList.toggle("show");
  if (b.classList.contains("show")) document.getElementById("in-search-input").focus();
  else { document.getElementById("in-search-count").textContent = ""; renderChat(); }
}

function askModel(messages) {
  var model = document.getElementById("model").value;
  var t = typingEl();
  var chat = document.getElementById("chat");
  chat.appendChild(t);
  chat.scrollTop = chat.scrollHeight;
  return fetch("/api/conversation/" + state.current.id + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: model, messages: messages })
  }).then(function(r) { return r.json(); }).then(function(d) { t.remove(); return d; })
    .catch(function(e) { t.remove(); throw e; });
}

function applyUsage(d) {
  if (!d.usage) return;
  if (d.usage.ext) {
    var cur = state.usageExt[d.usage.ext] || { tokens: 0, messages: 0 };
    cur.tokens += d.usage.tokens || 0;
    cur.messages += 1;
    state.usageExt[d.usage.ext] = cur;
  } else state.usage = d.usage;
  renderUsage();
}

function sendMessage() {
  var inp = document.getElementById("input");
  var text = inp.value.trim();
  if (!text && !state.pendingFiles.length) return;
  if (!state.current) { newConversation(); return; }
  inp.value = "";
  inp.style.height = "auto";
  state.queue.push({ text: text, files: state.pendingFiles.slice() });
  state.pendingFiles = [];
  renderChips();
  processQueue();
}

function processQueue() {
  if (state.processing) return;
  if (!state.queue.length) { state.processing = false; renderStatusChip(); return; }
  state.processing = true;
  renderStatusChip();
  var item = state.queue.shift();
  sendOne(item).then(processQueue);
}

function typeErr(code) {
  if (code === "type:blocked") return T.file_type_blocked;
  if (code === "type:unknown") return T.type_unknown;
  if (code === "type:toobig") return T.type_toobig;
  if (code === "extlimit") return T.limit_warn;
  return String(code).indexOf("type:") === 0 ? T.error_generic : code;
}

function sendOne(item) {
  var chat = document.getElementById("chat");
  if (chat.querySelector(".empty")) chat.innerHTML = "";
  var fctx = [];
  var chain = Promise.resolve();
  item.files.forEach(function(pf) {
    if (pf.dup) {
      var fe = state.files[pf.hash] || {};
      fctx.push({ hash: pf.hash, filename: pf.name, type: fe.cat || "text", dup: true });
      return;
    }
    chain = chain.then(function() {
      document.getElementById("upload-progress").textContent = T.uploading + " " + pf.name + "...";
      var fd = new FormData();
      fd.append("file", pf.file);
      return fetch("/api/upload/" + encodeURIComponent(state.current.model) + "?conv=" + encodeURIComponent(state.current.id), { method: "POST", body: fd }).then(function(r) { return r.json(); });
    }).then(function(d) {
      if (d.error) addMsg("error", T.error_prefix + " " + pf.name + " — " + typeErr(d.error));
      else fctx.push(d);
    });
  });
  return chain.then(function() {
    document.getElementById("upload-progress").textContent = "";
    var ut = item.text;
    if (fctx.length) ut += "\\n\\n[" + T.attached_files + " " + fctx.map(function(f) { return f.filename; }).join(", ") + "]";
    addMsg("user", ut);
    state.current.messages.push({ role: "user", content: ut, timestamp: Date.now() });
    var am = state.current.messages.map(function(m) { return { role: m.role, content: m.content }; });
    return askModel(am).then(function(d) {
      if (d.error) addMsg("error", T.error_prefix + " " + typeErr(d.error));
      else {
        addMsg("ai", d.response || "");
        state.current.messages.push({ role: "assistant", content: d.response || "", timestamp: Date.now() });
      }
      applyUsage(d);
      fetchState();
      fetchFiles();
    }).catch(function(e) {
      addMsg("error", T.error_connection + " " + e.message);
    });
  });
}

function editMsg(i) {
  var m = state.current.messages[i];
  var el = document.querySelector('#chat .msg[data-i="' + i + '"]');
  if (!el || m.role !== "user") return;
  el.innerHTML = '<div class="msg-editing"><textarea id="edit-ta" style="width:100%;background:var(--bg);color:var(--text);border:1px solid var(--accent);border-radius:8px;padding:8px 10px;font-size:14px;min-height:60px;resize:vertical">' + esc(m.content) + '</textarea><div class="btn-row"><button class="btn-primary" onclick="saveEdit(' + i + ')">' + T.save + '</button><button class="btn-secondary" onclick="renderChat()">' + T.cancel + '</button></div></div>';
  var ta = document.getElementById("edit-ta");
  ta.focus();
  ta.selectionStart = ta.selectionEnd = ta.value.length;
}

function saveEdit(i) {
  var v = document.getElementById("edit-ta").value;
  api("/api/conversation/" + state.current.id + "/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ editMessage: { index: i, content: v } })
  }).then(function() {
    return api("/api/conversation/" + state.current.id + "/get");
  }).then(function(conv) {
    state.current = conv;
    renderChat();
    fetchState();
  });
}

function copyMsg(i) {
  var m = state.current.messages[i];
  if (!m) return;
  var txt = String(m.content == null ? "" : m.content);
  var done = function() {
    var btns = document.querySelectorAll('#chat .msg[data-i="' + i + '"] .msg-act');
    for (var k = 0; k < btns.length; k++) if (btns[k].textContent === T.copy) btns[k].textContent = T.copied;
    setTimeout(renderChat, 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, done);
  else {
    var t2 = document.createElement("textarea");
    t2.value = txt;
    document.body.appendChild(t2);
    t2.select();
    document.execCommand("copy");
    t2.remove();
    done();
  }
}

function regenMsg(i) {
  if (!state.current || state.processing) return;
  var msgs = state.current.messages;
  if (!msgs[i] || msgs[i].role !== "assistant") return;
  var context = msgs.slice(0, i).map(function(m) {
    return { role: m.role === "assistant" ? "assistant" : "user", content: m.content };
  });
  if (!context.length) return;
  askModel(context).then(function(d) {
    if (d.error) addMsg("error", T.error_prefix + " " + typeErr(d.error));
    else {
      msgs[i] = { role: "assistant", content: d.response || "", timestamp: Date.now() };
      renderChat();
    }
    applyUsage(d);
    fetchState();
  }).catch(function(e) { addMsg("error", T.error_connection + " " + e.message); });
}

function clearChat() {
  if (!state.current || !confirm(T.clear)) return;
  api("/api/conversation/" + state.current.id + "/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clearMessages: true })
  }).then(function() {
    state.current.messages = [];
    renderChat();
    fetchState();
  });
}

function setSystemPrompt(id) {
  closeCtxMenu();
  api("/api/conversation/" + id + "/get").then(function(c) {
    showModal('<h2>' + T.system_prompt + '</h2><button class="modal-close" onclick="closeModal()">✕</button>'
      + '<textarea class="input-prompt" id="sp-ta" rows="3" style="resize:vertical" placeholder="' + T.system_prompt_ph + '">' + esc(c.systemPrompt) + '</textarea>'
      + '<div class="f-info">' + esc(c.model || "") + '</div>'
      + '<div class="btn-row"><button class="btn-primary" onclick="doSystemPrompt(\\'' + id + '\\')">' + T.save + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + '</button></div>');    setTimeout(function() { document.getElementById("sp-ta").focus(); }, 50);
  });
}

function doSystemPrompt(id) {
  var v = document.getElementById("sp-ta").value;
  api("/api/conversation/" + id + "/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ systemPrompt: v })
  }).then(function() { fetchState(); closeModal(); });
}

function exportConversation(id) {
  closeCtxMenu();
  var u = "/api/conversation/" + id + "/export?format=";
  showModal('<h2>' + T.export_title + '</h2><button class="modal-close" onclick="closeModal()">✕</button><div class="btn-row">'
    + '<button class="btn-secondary" onclick="window.open(\\'' + u + 'txt\\')">' + T.export_txt + "</button>"
    + '<button class="btn-secondary" onclick="window.open(\\'' + u + 'md\\')">' + T.export_md + "</button>"
    + '<button class="btn-secondary" onclick="window.open(\\'' + u + 'html\\')">' + T.export_html + "</button>"
    + '<button class="btn-primary" onclick="window.open(\\'' + u + 'html&pdf=1\\')">' + T.export_pdf + "</button>"
    + "</div>");
}

function doLogout() {
  fetch("/api/logout", { method: "POST" }).then(function() { window.location.href = "/"; });
}
`;
}
