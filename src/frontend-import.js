export function getJsImport() {
  return `
var impFound = [];
var impView = "main";

function impTabHtml() {
  return impView === "manual" ? impManualHtml() : impMainHtml();
}

function impMainHtml() {
  var opts = "<option value=''>" + T.imp_model + "</option>";
  for (var k in MI) opts += '<option value="' + k + '">' + modelIcon(k) + " " + MI[k].name + "</option>";
  (state.modelsExt || []).forEach(function(m) { opts += '<option value="ext:' + m.id + '">🔌 ' + esc(m.name) + "</option>"; });
  var h = '<button class="btn-secondary" style="min-height:36px;margin-bottom:10px" onclick="impView=&#39;manual&#39;;showSetTab(&#39;import&#39;)">' + T.imp_manual + "</button>";
  h += '<label class="f-label">' + T.imp_drop + "</label>";
  h += '<input type="file" id="imp-files" multiple accept=".json,.jsonl,.md,.txt" style="margin:4px 0;width:100%">';
  h += '<label class="f-label">' + T.imp_paste + "</label>";
  h += '<textarea id="imp-paste" class="input-prompt" rows="4" placeholder="' + T.imp_paste_ph + '" style="resize:vertical;font-family:monospace;font-size:12px"></textarea>';
  h += '<button class="btn-secondary" style="min-height:36px" onclick="impAddPasted()">' + T.imp_add + "</button>";
  h += '<div id="imp-found" style="margin:10px 0">' + impFoundHtml() + "</div>";
  h += '<label class="f-label">' + T.imp_folder + '</label><input class="input-prompt" id="imp-folder" value="Importado">';
  h += '<label class="f-label">' + T.imp_model + '</label><select class="folder-select" id="imp-model">' + opts + "</select>";
  h += '<div class="btn-row"><button class="btn-primary" onclick="doImport()">' + T.imp_do + "</button></div>";
  h += '<div class="sep" style="margin:16px 0"></div>';
  h += '<div class="f-label">' + T.imp_prompt + "</div>";
  h += '<div class="f-info">' + T.imp_prompt_info + "</div>";
  h += '<label class="f-label">' + T.imp_term + '</label><input class="input-prompt" id="imp-term">';
  h += '<div class="btn-row"><button class="btn-secondary" onclick="genExportPrompt()">' + T.imp_gen + '</button><button class="btn-secondary" onclick="copyPrompt()">📋 ' + T.copy + "</button></div>";
  h += '<textarea id="imp-prompt" class="input-prompt" rows="5" style="resize:vertical;font-family:monospace;font-size:12px;margin-top:6px"></textarea>';
  return h;
}

function impManualHtml() {
  var h = '<button class="btn-secondary" style="min-height:36px;margin-bottom:10px" onclick="impView=&#39;main&#39;;showSetTab(&#39;import&#39;)">' + T.back + "</button>";
  h += "<h3>" + T.manual_title + "</h3>";
  (T.manual || []).forEach(function(m) {
    h += '<div class="model-card"><h3>' + esc(m.n) + "</h3><ul>";
    m.s.forEach(function(s) { h += "<li>" + esc(s) + "</li>"; });
    h += "</ul></div>";
  });
  return h;
}

function impFoundHtml() {
  if (!impFound.length) return "";
  var total = 0;
  impFound.forEach(function(c) { total += c.messages.length; });
  var h = '<div class="file-row"><span>✅ ' + impFound.length + " " + T.imp_found + " · " + total + ' msgs</span><button class="btn-secondary" style="min-height:32px;margin-left:auto" onclick="impFound=[];renderImpFound()">' + T.imp_clear + "</button></div>";
  impFound.forEach(function(c) { h += '<div class="f-meta" style="padding:2px 4px">' + esc(c.title) + " (" + c.messages.length + ")</div>"; });
  return h;
}

function renderImpFound() {
  var el = document.getElementById("imp-found");
  if (el) el.innerHTML = impFoundHtml();
}

function impBindFiles() {
  var fi = document.getElementById("imp-files");
  if (fi) fi.onchange = function() { impHandleFiles(this.files); this.value = ""; };
}

function stripFences(s) {
  var t = String(s).trim();
  var i = t.indexOf("\`\`\`");
  if (i >= 0) {
    var m = t.slice(i).match(/^\`\`\`(?:json)?\\s*([\\s\\S]*)\\s*\`\`\`\s*$/);
    if (m) return m[1].trim();
  }
  return t;
}

function normMsg(role, content, ts) {
  var c = String(content == null ? "" : content).trim();
  return { role: String(role || "").indexOf("assist") >= 0 ? "assistant" : "user", content: c.slice(0, 50000), timestamp: ts || Date.now() };
}

function parseChatGPT(obj) {
  if (obj && Array.isArray(obj.messages) && obj.messages[0] && obj.messages[0].author) {
    var msgs = [];
    obj.messages.forEach(function(m) {
      var role = m.author && m.author.role === "assistant" ? "assistant" : "user";
      var text = m.content && m.content.parts ? m.content.parts.join("") : "";
      if (text) msgs.push(normMsg(role, text, m.create_time ? new Date(Number(m.create_time) * 1000).getTime() : Date.now()));
    });
    return msgs.length ? [{ title: obj.title || (obj.metadata && obj.metadata.title) || "ChatGPT", source: "ChatGPT", messages: msgs }] : null;
  }
  return null;
}

function parseClaude(obj) {
  var list = Array.isArray(obj) ? obj : (obj && Array.isArray(obj.conversations) ? obj.conversations : null);
  if (!list || !list[0] || !list[0].chat_messages) return null;
  var out = [];
  list.forEach(function(c) {
    var msgs = (c.chat_messages || []).filter(function(m) { return m.sender !== "system"; }).map(function(m) {
      var t = m.message;
      var text = Array.isArray(t) ? t.map(function(p) { return typeof p === "string" ? p : (p && (p.text || p.content)) || ""; }).join("") : (typeof t === "string" ? t : "");
      return normMsg(m.sender === "human" ? "user" : "assistant", text, m.created_at ? Date.parse(m.created_at) : Date.now());
    }).filter(function(m) { return m.content; });
    if (msgs.length) out.push({ title: c.title || ("Claude " + String(c.created_at || "").slice(0, 10)), source: "Claude", messages: msgs });
  });
  return out.length ? out : null;
}

function parseGemini(obj) {
  if (!Array.isArray(obj) || !obj[0] || !obj[0].timestamp) return null;
  var msgs = obj.map(function(e) {
    var text = e.text || e.description || e.title || "";
    return text ? normMsg("user", text, Date.parse(e.timestamp)) : null;
  }).filter(Boolean);
  return msgs.length ? [{ title: "Gemini (Takeout)", source: "Gemini", messages: msgs }] : null;
}

function parseGeneric(obj) {
  if (Array.isArray(obj) && obj.length && obj[0] && obj[0].role && obj[0].content) {
    return [{ title: obj[0].title || "Importado", source: obj[0].source || "IA", messages: obj.map(function(m) { return normMsg(m.role, m.content, m.timestamp); }) }];
  }
  if (obj && Array.isArray(obj.messages) && obj.messages[0] && obj.messages[0].role) {
    return [{ title: obj.title || "Importado", source: obj.source || "IA", messages: obj.messages.map(function(m) { return normMsg(m.role, m.content, m.timestamp); }) }];
  }
  return null;
}

function parseMarkdown(text, fname) {
  var re = /^\\s*(?:#{1,6}\\s*)?(?:\\*\\*)?(You|Tú|Human|Usuario|Assistant|IA|ChatGPT|Claude|Gemini|Grok|DeepSeek|Modelo)\\s*(?:\\*\\*)?[:\\-–]\\s*(?:\\*\\*)?\\s*(.*)$/i;
  var aiRe = /^(Assistant|IA|ChatGPT|Claude|Gemini|Grok|DeepSeek|Modelo)$/i;
  var msgs = [], cur = null;
  String(text).split(/\\r?\\n/).forEach(function(l) {
    var m = l.match(re);
    if (m) { if (cur) msgs.push(cur); cur = { role: aiRe.test(m[1]) ? "assistant" : "user", content: m[2].trim() }; }
    else if (cur && l.trim()) cur.content += "\\n" + l.trim();
  });
  if (cur) msgs.push(cur);
  if (msgs.length < 2) return null;
  return [{ title: String(fname).replace(/\\.[^.]+$/, "") || "Importado", source: "md", messages: msgs.map(function(m) { return normMsg(m.role, m.content); }) }];
}

function impParseText(text, fname) {
  var found = null;
  if (/\\.jsonl?$/i.test(fname)) {
    var arr = [];
    String(text).split(/\\r?\\n/).forEach(function(l) {
      l = l.trim();
      if (!l) return;
      try { arr.push(JSON.parse(l)); } catch (e) {}
    });
    if (arr.length && arr[0] && arr[0].role) found = [{ title: String(fname).replace(/\\.[^.]+$/, ""), source: "jsonl", messages: arr.map(function(m) { return normMsg(m.role, m.content, m.timestamp); }) }];
  }
  if (!found) {
    try {
      var obj = JSON.parse(stripFences(text));
      found = parseChatGPT(obj) || parseClaude(obj) || parseGemini(obj) || parseGeneric(obj);
    } catch (e) { found = null; }
  }
  if (!found && /\\.(md|txt)$/i.test(fname)) found = parseMarkdown(text, fname);
  if (found) { impFound = impFound.concat(found); renderImpFound(); }
}

function impHandleFiles(list) {
  Array.prototype.slice.call(list).forEach(function(f) {
    var rd = new FileReader();
    rd.onload = function() { impParseText(String(rd.result), f.name); };
    rd.readAsText(f);
  });
}

function impAddPasted() {
  var ta = document.getElementById("imp-paste");
  var v = ta.value.trim();
  if (!v) return;
  impParseText(v, "pegado.json");
  ta.value = "";
}

function doImport() {
  if (!impFound.length) return;
  var body = { folderName: val("imp-folder") || "Importado", model: val("imp-model") || null, conversations: impFound };
  api("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function(d) {
    alert(d.created + " " + T.imp_done);
    impFound = [];
    renderImpFound();
    fetchState();
  });
}

function genExportPrompt() {
  var term = val("imp-term");
  var filter = term ? String(T.imp_filter_term).replace("__TERM__", term) : T.imp_filter_all;
  document.getElementById("imp-prompt").value = String(T.imp_prompt_tpl).replace("__FILTER__", filter);
}

function copyPrompt() {
  var ta = document.getElementById("imp-prompt");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value);
  ta.focus();
  ta.select();
}
`;
}
