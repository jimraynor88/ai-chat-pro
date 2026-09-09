export function getJsState() {
  return `
var state = {
  conversations: [], folders: [], usage: { neurons: 0, messages: 0 }, usageExt: {}, modelsExt: [],
  defaultModel: "", modelPrompts: {},
  current: null, pendingFiles: [], queue: [], processing: false,
  bookmarks: [], inSearch: false, foldOpen: {},
  news: [], readNews: []
};
var COLORS = ["none","red","blue","green","yellow","purple","orange","pink"];
var T = window.__T || {};
var MI = window.__MI || {};
var SET = window.__SET || {};

function api(path, opts) {
  opts = opts || {};
  return fetch(path, opts).then(function(r) {
    if (r.status === 401) { window.location.href = "/"; return { error: "unauth" }; }
    return r.json();
  });
}

function fetchState() {
  return api("/api/state").then(function(d) {
    state.conversations = d.conversations || [];
    state.folders = d.folders || [];
    state.usage = d.usage || { neurons: 0, messages: 0 };
    state.usageExt = d.usageExt || {};
    state.modelsExt = d.modelsExt || [];
    state.defaultModel = d.defaultModel || "";
    state.modelPrompts = d.modelPrompts || {};
    state.readNews = d.readNews || [];
    renderModelSelect(); renderSidebar(); renderUsage(); renderStatusChip(); fetchFiles();
  });
}

function esc(s) { if (s == null) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function fmtBytes(n) { if (n < 1024) return n + " B"; if (n < 1048576) return (n / 1024).toFixed(1) + " KB"; return (n / 1048576).toFixed(1) + " MB"; }
function fmtTime(ts) { if (!ts) return ""; var d = new Date(ts); var diff = (Date.now() - ts) / 1000; if (diff < 60) return T.now; if (diff < 3600) return Math.floor(diff / 60) + "m"; if (diff < 86400) return Math.floor(diff / 3600) + "h"; if (diff < 604800) return Math.floor(diff / 86400) + "d"; return d.toLocaleDateString(); }
function fmtDateTime(ts) { if (!ts) return ""; var d = new Date(ts); return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

function showModal(html) { document.getElementById("modal-content").innerHTML = html; document.getElementById("modal-bg").classList.add("show"); }
function closeModal() { document.getElementById("modal-bg").classList.remove("show"); }
function closeCtxMenu() { document.getElementById("ctx-menu").classList.remove("show"); }

function isMobile() { return window.matchMedia("(max-width:768px)").matches; }
function toggleSidebar() {
  var app = document.getElementById("app");
  if (isMobile()) {
    app.classList.toggle("sb-open-mobile");
    document.getElementById("overlay").classList.toggle("show", app.classList.contains("sb-open-mobile"));
  } else {
    app.classList.toggle("sb-closed");
  }
}
function closeMobileSidebar() {
  document.getElementById("app").classList.remove("sb-open-mobile");
  document.getElementById("overlay").classList.remove("show");
}

document.addEventListener("click", function(e) {
  if (!e.target.closest("#ctx-menu") && !e.target.closest(".conv-menu-btn")) closeCtxMenu();
  if (!e.target.closest("#bm-wrap")) document.getElementById("bm-drop").classList.remove("show");
});
`;
}
