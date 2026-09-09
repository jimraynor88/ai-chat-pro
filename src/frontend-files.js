export function getJsFiles() {
  return `
function sha256File(file) {
  if (!crypto.subtle || !file) return Promise.resolve(null);
  return file.arrayBuffer().then(function(buf) {
    return crypto.subtle.digest("SHA-256", buf).then(function(d) {
      return Array.from(new Uint8Array(d)).map(function(b) { return b.toString(16).padStart(2, "0"); }).join("");
    });
  }).catch(function() { return null; });
}

document.getElementById("file-input").addEventListener("change", function() {
  var files = Array.prototype.slice.call(this.files);
  this.value = "";
  var chain = Promise.resolve();
  files.forEach(function(f) {
    chain = chain.then(function() { return sha256File(f); }).then(function(h) {
      state.pendingFiles.push({ file: f, name: f.name, type: f.type, hash: h, dup: !!(h && state.files[h]) });
    });
  });
  chain.then(renderChips);
});

function renderChips() {
  var d = document.getElementById("file-chips");
  d.innerHTML = "";
  state.pendingFiles.forEach(function(pf, i) {
    var c = document.createElement("div");
    c.className = "file-chip" + (pf.dup ? " dup" : "");
    if (pf.type && pf.type.indexOf("image/") === 0) {
      var img = document.createElement("img");
      img.src = URL.createObjectURL(pf.file);
      c.appendChild(img);
    }
    var n = document.createElement("span");
    n.textContent = pf.name + (pf.dup ? " ✓" : "");
    c.appendChild(n);
    var rm = document.createElement("span");
    rm.className = "remove";
    rm.textContent = "✕";
    rm.onclick = function() { state.pendingFiles.splice(i, 1); renderChips(); };
    c.appendChild(rm);
    d.appendChild(c);
  });
}

function fetchFiles() {
  return api("/api/files").then(function(idx) {
    state.files = idx || {};
    if (state.current) renderChatFiles();
  }).catch(function() {});
}

function openFilesPanel() {
  fetchFiles().then(showFilesPanel);
}

function showFilesPanel() {
  var files = state.files || {};
  var keys = Object.keys(files);
  var h = '<h2>' + T.files_title + '</h2><button class="modal-close" onclick="closeModal()">✕</button>';
  if (!keys.length) h += '<div class="f-info">' + T.files_empty + "</div>";
  keys.sort(function(a, b) { return files[b].createdAt - files[a].createdAt; }).forEach(function(hash) {
    var f = files[hash];
    var ic = f.cat === "image" ? "🖼" : f.cat === "pdf" ? "📄" : f.cat === "zip" ? "🗜" : "📃";
    h += '<div class="file-row"><span>' + ic + "</span>";
    h += '<span class="f-name" title="' + esc(f.name) + '">' + esc(f.name) + (f.external ? " ☁️" : "") + "</span>";
    h += '<button class="icon-btn" style="min-height:30px" onclick="shareFile(\\'' + hash + '\\')">' + T.share + "</button>";
    (f.convIds || []).forEach(function(cid) {
      var c = state.conversations.find(function(x) { return x.id === cid; });
      if (!c) return;
      h += '<span class="file-chip">' + esc(c.title.slice(0, 24)) + ' <span class="remove" onclick="detachFile(\\'' + hash + '\\',\\'' + cid + '\\')">✕</span></span>';
    });
    if (!(f.convIds || []).length) h += '<span class="f-meta">' + T.no_convos + "</span>";
    h += '<span class="f-meta">' + fmtBytes(f.size) + " · " + new Date(f.createdAt).toLocaleDateString() + "</span>";
    h += "</div>";
  });
  showModal(h);
}

function shareFile(hash) {
  var opts = "";
  state.conversations.forEach(function(c) {
    opts += '<option value="' + c.id + '"' + (state.current && state.current.id === c.id ? " selected" : "") + ">" + esc(c.title) + " · " + esc(modelInfo(c.model).name) + "</option>";
  });
  if (!opts) { closeModal(); alert(T.no_conversations); return; }
  var h = '<h2>' + T.share_to + '</h2><button class="modal-close" onclick="closeModal()">✕</button>'
    + '<select class="folder-select" id="sh-conv">' + opts + "</select>"
    + '<div class="btn-row"><button class="btn-primary" onclick="doShare(\\'' + hash + '\\')">' + T.share + '</button><button class="btn-secondary" onclick="showFilesPanel()">' + T.cancel + "</button></div>";
  showModal(h);
}

function doShare(hash) {
  var cid = document.getElementById("sh-conv").value;
  api("/api/files/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: hash, convId: cid }) }).then(function() {
    fetchFiles();
    showFilesPanel();
  });
}

function detachFile(hash, cid) {
  api("/api/files/detach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash: hash, convId: cid }) }).then(function() {
    fetchFiles();
    showFilesPanel();
  });
}
`;
}
