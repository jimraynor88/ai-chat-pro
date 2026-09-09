export function getJsSettings() {
  return `
function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ""; }
function backToModels() { openSettings(); showSetTab("models"); }

function openSettings() {
  var tabs = [
    ["retention", T.tab_retention],
    ["storage", T.tab_storage],
    ["models", T.tab_models],
    ["import", T.tab_import]
  ];
  var h = '<h2>' + T.settings_title + '</h2><button class="modal-close" onclick="closeModal()">✕</button>';
  h += '<div class="tabs">';
  tabs.forEach(function(t2) { h += '<button data-tab="' + t2[0] + '" onclick="showSetTab(this.dataset.tab)">' + t2[1] + "</button>"; });
  h += '</div><div id="set-body"></div>';
  showModal(h);
  showSetTab("retention");
}

function showSetTab(tab) {
  var body = document.getElementById("set-body");
  document.querySelectorAll(".tabs button").forEach(function(b) { b.classList.toggle("on", b.dataset.tab === tab); });
  if (tab === "retention") body.innerHTML = setRetentionHtml();
  else if (tab === "storage") { body.innerHTML = setStorageHtml(); stFields(); }
  else if (tab === "import") { body.innerHTML = impTabHtml(); impBindFiles(); }
  else body.innerHTML = setModelsHtml();
}

function setRetentionHtml() {
  var cur = (window.__SET && window.__SET.retention) || 0;
  var opts = [["0", T.retention_never], ["1", T.retention_1d], ["7", T.retention_7d], ["14", T.retention_14d], ["30", T.retention_30d], ["183", T.retention_183d], ["365", T.retention_365d]];
  var h = '<label class="f-label">' + T.retention_label + '</label><select class="folder-select" id="ret-sel">';
  opts.forEach(function(o) { h += '<option value="' + o[0] + '"' + (parseInt(cur) === parseInt(o[0]) ? " selected" : "") + ">" + o[1] + "</option>"; });
  h += '</select><div class="f-info">' + T.retention_info + '</div><div class="btn-row"><button class="btn-primary" onclick="saveRetention()">' + T.save + "</button></div>";
  return h;
}
function saveRetention() {
  var v = parseInt(val("ret-sel")) || 0;
  api("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retention: v }) }).then(function() {
    if (window.__SET) window.__SET.retention = v;
    alert(T.saved);
  });
}

function setStorageHtml() {
  var cur = (window.__SET && window.__SET.storageType) || "off";
  var h = '<div class="f-info">' + T.storage_info + "</div>";
  h += '<label class="f-label">' + T.storage_type + '</label><select class="folder-select" id="st-type" onchange="stFields()">'
    + '<option value="off"' + (cur === "off" ? " selected" : "") + ">" + T.storage_off + "</option>"
    + '<option value="s3"' + (cur === "s3" ? " selected" : "") + ">" + T.storage_s3 + "</option>"
    + '<option value="webdav"' + (cur === "webdav" ? " selected" : "") + ">" + T.storage_webdav + "</option></select>";
  h += '<div id="st-fields"></div>';
  h += '<div class="btn-row"><button class="btn-primary" onclick="saveStorage()">' + T.save + '</button><button class="btn-secondary" onclick="testStorage()">' + T.storage_test + "</button></div>";
  h += '<div id="st-result" class="f-info" style="display:none"></div>';
  return h;
}
function stFields() {
  var el = document.getElementById("st-fields");
  if (!el) return;
  var type = val("st-type") || "off";
  if (type === "off") { el.innerHTML = ""; return; }
  var h = '<label class="f-label">' + T.endpoint + '</label><input class="input-prompt" id="st-endpoint" placeholder="https://...">';
  if (type === "s3") {
    h += '<label class="f-label">' + T.region + '</label><input class="input-prompt" id="st-region" placeholder="auto">';
    h += '<label class="f-label">' + T.bucket + '</label><input class="input-prompt" id="st-bucket">';
    h += '<label class="f-label">' + T.access_key + '</label><input class="input-prompt" id="st-ak">';
    h += '<label class="f-label">' + T.secret_key + '</label><input class="input-prompt" id="st-sk">';
  } else {
    h += '<label class="f-label">' + T.bucket + '</label><input class="input-prompt" id="st-bucket">';
    h += '<label class="f-label">' + T.user + '</label><input class="input-prompt" id="st-user">';
    h += '<label class="f-label">' + T.pass + '</label><input class="input-prompt" id="st-pass">';
  }
  h += '<label class="f-label">' + T.public_url + '</label><input class="input-prompt" id="st-url">';
  el.innerHTML = h;
}
function storagePayload() {
  var st = { type: val("st-type"), endpoint: val("st-endpoint"), region: val("st-region") || "auto", bucket: val("st-bucket"), publicUrl: val("st-url") };
  var ak = val("st-ak"); if (ak) st.accessKey = ak;
  var sk = val("st-sk"); if (sk) st.secretKey = sk;
  var u = val("st-user"); if (u) st.user = u;
  var p = val("st-pass"); if (p) st.pass = p;
  return st;
}
function saveStorage() {
  var type = val("st-type");
  api("/api/settings/storage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storageExt: storagePayload() }) }).then(function() {
    if (window.__SET) window.__SET.storageType = type;
    alert(T.saved);
    fetchState();
  });
}
function testStorage() {
  var res = document.getElementById("st-result");
  res.style.display = "block";
  res.textContent = T.loading;
  api("/api/settings/storage-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storageExt: storagePayload() }) }).then(function(d) {
    res.textContent = d.ok ? (T.storage_test_ok + " (" + d.status + ")") : (T.storage_test_fail + (d.error ? " " + d.error : ""));
  });
}

function setModelsHtml() {
  var h = '<div class="f-info">' + T.ext_models_info + "</div>";
  var dOpts = '<option value="">' + T.default_model + "</option>";
  for (var k2 in MI) dOpts += '<option value="' + k2 + '"' + (state.defaultModel === k2 ? " selected" : "") + ">" + modelIcon(k2) + " " + MI[k2].name + "</option>";
  (state.modelsExt || []).forEach(function(x) { dOpts += '<option value="ext:' + x.id + '"' + (state.defaultModel === "ext:" + x.id ? " selected" : "") + ">🔌 " + esc(x.name) + "</option>"; });
  h += '<label class="f-label">' + T.default_model + '</label><select class="folder-select" onchange="saveDefaultModel(this.value)">' + dOpts + "</select>";
  h += '<div class="f-label" style="margin-top:14px">' + T.group_cf + "</div>";
  for (var k3 in MI) {
    h += '<div class="file-row" style="margin-bottom:4px"><span style="flex:1">' + modelIcon(k3) + " " + MI[k3].name + (state.modelPrompts[k3] ? " 🗣" : "") + '</span><button class="icon-btn" style="min-height:30px" onclick="modelNote(\\'' + k3 + '\\')">🗣</button></div>';
  }
  h += '<div class="f-label" style="margin-top:8px">' + T.group_ext + "</div>";
  (state.modelsExt || []).forEach(function(m) {
    h += '<div class="ext-model"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
      + '<span style="font-weight:600">🔌 ' + esc(m.name || m.modelId) + "</span>"
      + '<span class="f-meta" style="flex-basis:auto">' + esc(m.provider || "") + " · " + esc(m.modelId || "") + "</span>"
      + '<button class="icon-btn" style="min-height:30px;margin-left:auto" onclick="modelNote(\\'' + ("ext:" + m.id) + '\\')">🗣</button>'
      + '<button class="icon-btn" style="min-height:30px" onclick="editModel(\\'' + m.id + '\\')">' + T.rename + "</button>"
      + '<button class="icon-btn danger" style="min-height:30px" onclick="delModel(\\'' + m.id + '\\')">🗑</button></div>'
      + '<div class="f-meta">in $' + (m.costIn || 0) + '/1M · out $' + (m.costOut || 0) + '/1M · ' + (m.dailyLimit ? m.dailyLimit.toLocaleString() + " tok/d" : "∞") + "</div></div>";
  });
  h += '<div class="btn-row"><button class="btn-primary" onclick="modelForm()">' + T.add_model + "</button></div>";
  return h;
}

function modelForm() {
  showModal(modelFormHtml(null));
  setTimeout(function() { var e = document.getElementById("mf-modelid"); if (e) e.focus(); }, 50);
}
function editModel(id) {
  var m = (state.modelsExt || []).find(function(x) { return x.id === id; });
  if (!m) return;
  showModal(modelFormHtml(m));
}
function modelFormHtml(m) {
  var prov = m ? m.provider : "openai";
  var h = '<h2>' + (m ? T.rename : T.add_model) + '</h2><button class="modal-close" onclick="closeModal()">✕</button>';
  h += '<label class="f-label">' + T.provider + '</label><select class="folder-select" id="mf-prov">'
    + '<option value="openai"' + (prov === "openai" ? " selected" : "") + ">" + T.prov_openai + "</option>"
    + '<option value="anthropic"' + (prov === "anthropic" ? " selected" : "") + ">" + T.prov_anthropic + "</option></select>";
  h += '<label class="f-label">' + T.base_url + '</label><input class="input-prompt" id="mf-base" placeholder="https://router.huggingface.co/v1" value="' + esc(m && m.baseUrl || "") + '">';
  h += '<label class="f-label">' + T.api_key + '</label><input class="input-prompt" id="mf-key" value="' + esc(m && m.apiKey || "") + '">';
  h += '<label class="f-label">' + T.model_id + '</label><input class="input-prompt" id="mf-modelid" value="' + esc(m && m.modelId || "") + '">';
  h += '<label class="f-label">' + T.display_name + '</label><input class="input-prompt" id="mf-name" value="' + esc(m && m.name || "") + '">';
  h += '<label class="f-label">' + T.cost_in + '</label><input type="number" class="input-prompt" id="mf-cin" value="' + (m && m.costIn || 0) + '">';
  h += '<label class="f-label">' + T.cost_out + '</label><input type="number" class="input-prompt" id="mf-cout" value="' + (m && m.costOut || 0) + '">';
  h += '<label class="f-label">' + T.daily_limit + '</label><input type="number" class="input-prompt" id="mf-limit" value="' + (m && m.dailyLimit || 0) + '">';
  h += '<label class="f-label" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="mf-img" ' + (m && (m.fileTypes || []).indexOf("image") >= 0 ? "checked" : "") + "> " + T.accepts_image + "</label>";
  h += '<div class="btn-row"><button class="btn-primary" onclick="doModelSave(\\'' + (m ? m.id : "") + '\\')">' + (m ? T.save : T.create) + '</button>'
    + '<button class="btn-secondary" onclick="testModelForm()">' + T.test_model + '</button>'
    + '<button class="btn-secondary" onclick="backToModels()">' + T.cancel + "</button></div>";
  return h;
}
function doModelSave(id) {
  var prov = val("mf-prov");
  var body = {
    provider: prov,
    modelId: val("mf-modelid"),
    name: val("mf-name") || val("mf-modelid"),
    costIn: parseFloat(val("mf-cin")) || 0,
    costOut: parseFloat(val("mf-cout")) || 0,
    dailyLimit: parseInt(val("mf-limit")) || 0,
    acceptsImage: document.getElementById("mf-img").checked
  };
  var base = val("mf-base");
  if (base) body.baseUrl = base;
  var key = val("mf-key");
  if (key) body.apiKey = key;
  if (prov === "anthropic" && !base) body.baseUrl = "https://api.anthropic.com";
  if (id) body.id = id;
  api(id ? "/api/settings/model-update" : "/api/settings/model-add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function() {
    fetchState().then(function() { backToModels(); alert(T.saved); });
  });
}
function testModelForm() {
  var prov = val("mf-prov");
  var base = val("mf-base");
  var key = val("mf-key");
  var mid = val("mf-modelid");
  if (!mid || !key) { alert(T.test_fail + ": " + T.api_key); return; }
  if (prov === "anthropic" && !base) base = "https://api.anthropic.com";
  api("/api/settings/model-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: prov, modelId: mid, baseUrl: base, apiKey: key }) }).then(function(d) {
    alert(d.ok ? (T.test_ok + "\\n" + d.response) : (T.test_fail + ": " + d.error));
  });
}
function delModel(id) {
  if (!confirm(T.delete_confirm)) return;
  api("/api/settings/model-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id }) }).then(function() {
    fetchState().then(backToModels);
  });
}

function saveDefaultModel(v) {
  api("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defaultModel: v }) }).then(fetchState);
}
function modelNote(modelKey) {
  var nm = modelKey.indexOf("ext:") === 0 ? (((state.modelsExt || []).find(function(x) { return x.id === modelKey.slice(4); }) || {}).name || modelKey) : ((MI[modelKey] || {}).name || modelKey);
  showModal('<h2>' + T.model_note + " · " + esc(nm) + '</h2><button class="modal-close" onclick="closeModal()">✕</button>'
    + '<div class="f-info">' + T.model_note_applies + '</div>'
    + '<textarea class="input-prompt" id="note-ta" rows="4" style="resize:vertical" placeholder="' + T.model_note_ph + '">' + esc(state.modelPrompts[modelKey] || "") + '</textarea>'
    + '<div class="btn-row"><button class="btn-primary" onclick="saveModelNote(\\'' + modelKey + '\\')">' + T.save + '</button><button class="btn-secondary" onclick="closeModal()">' + T.cancel + "</button></div>");
  setTimeout(function() { var e = document.getElementById("note-ta"); if (e) e.focus(); }, 50);
}
function saveModelNote(modelKey) {
  var mp = JSON.parse(JSON.stringify(state.modelPrompts || {}));
  var v = document.getElementById("note-ta").value;
  if (v) mp[modelKey] = v; else delete mp[modelKey];
  api("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelPrompts: mp }) }).then(function() {
    state.modelPrompts = mp;
    closeModal();
    alert(T.saved);
  });
}
`;
}
