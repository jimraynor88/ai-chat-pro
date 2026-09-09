export function getJsUsage() {
  return `
function modelInfo(key) {
  if (key && key.indexOf("ext:") === 0) {
    var m = (state.modelsExt || []).find(function(x) { return x.id === key.slice(4); });
    return { name: m ? (m.name || m.modelId) : key, icon: "🔌", external: true };
  }
  var cf = MI[key];
  return cf ? { name: cf.name, icon: modelIcon(key), external: false } : { name: key, icon: "❓", external: false };
}

function renderModelSelect() {
  var sel = document.getElementById("model");
  var h = '<optgroup label="' + T.group_cf + '">';
  for (var k in MI) h += '<option value="' + k + '">' + MI[k].name + "</option>";
  h += "</optgroup>";
  if (state.modelsExt && state.modelsExt.length) {
    h += '<optgroup label="' + T.group_ext + '">';
    state.modelsExt.forEach(function(m) {
      h += '<option value="ext:' + m.id + '">' + esc(m.name || m.modelId) + "</option>";
    });
    h += "</optgroup>";
  }
  sel.innerHTML = h;
  if (state.current && state.current.model) sel.value = state.current.model;
  else if (state.defaultModel) sel.value = state.defaultModel;
  if (!sel.value) sel.value = Object.keys(MI)[0];
  syncAccept();
}

function changeModel(val) {
  if (state.current) {
    state.current.model = val;
    api("/api/conversation/" + state.current.id + "/update", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: val }) }).then(fetchState);
  }
  syncAccept();
  renderUsage();
  renderStatusChip();
}

function syncAccept() {
  var key = (document.getElementById("model").value || "").trim();
  if (!key) return;
  api("/api/files/accept/" + encodeURIComponent(key)).then(function(d) {
    var fi = document.getElementById("file-input");
    if (fi) fi.accept = d.accept || "";
  }).catch(function() {});
}

function renderUsage() {
  var key = document.getElementById("model").value;
  var fill = document.getElementById("usage-fill");
  var txt = document.getElementById("usage-text");
  if (!key) { fill.style.width = "0%"; txt.textContent = "—"; return; }
  if (key.indexOf("ext:") === 0) {
    var m = (state.modelsExt || []).find(function(x) { return x.id === key.slice(4); });
    if (!m) { txt.textContent = "—"; return; }
    var u = state.usageExt[m.id] || { tokens: 0, tin: 0, tout: 0 };
    if (m.dailyLimit > 0) {
      var pct = Math.min(100, (u.tokens / m.dailyLimit) * 100);
      fill.style.width = pct + "%";
      fill.style.background = pct < 50 ? "var(--green)" : pct < 80 ? "var(--yellow)" : "var(--red)";
      txt.textContent = Math.max(0, m.dailyLimit - u.tokens).toLocaleString() + " " + T.tokens_left;
    } else {
      var cost = (((u.tin || 0) * (m.costIn || 0)) + ((u.tout || 0) * (m.costOut || 0))) / 1000000;
      fill.style.width = "0%";
      fill.style.background = "var(--blue)";
      txt.textContent = u.tokens.toLocaleString() + " tok · $" + cost.toFixed(2);
    }
  } else {
    var used = state.usage.neurons || 0;
    var pct2 = Math.min(100, (used / 10000) * 100);
    fill.style.width = pct2 + "%";
    fill.style.background = pct2 < 50 ? "var(--green)" : pct2 < 80 ? "var(--yellow)" : "var(--red)";
    var mi = MI[key];
    var nIn = mi ? mi.nIn : 3000, nOut = mi ? mi.nOut : 10000;
    txt.textContent = "≈" + Math.floor(Math.max(0, 10000 - used) / ((100 * nIn + 200 * nOut) / 1000000)) + " " + T.messages_left;
  }
}

function renderStatusChip() {
  var chip = document.getElementById("status-chip");
  var spin = document.getElementById("status-spin");
  var sm = document.getElementById("status-model");
  var ss = document.getElementById("status-state");
  if (!chip) return;
  var key = document.getElementById("model") ? document.getElementById("model").value : "";
  var info = modelInfo(key);
  sm.textContent = info.icon + " " + info.name;
  if (state.processing) {
    chip.classList.add("busy");
    spin.style.display = "block";
    ss.textContent = " " + T.processing + (state.queue.length ? " · " + state.queue.length + " " + T.queued : "");
  } else {
    chip.classList.remove("busy");
    spin.style.display = "none";
    ss.textContent = state.queue.length ? " · " + state.queue.length + " " + T.queued : "";
  }
}
`;
}
