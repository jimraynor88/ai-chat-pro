export function getJsShortcuts() {
  return `
document.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    var app = document.getElementById("app");
    if (isMobile() && !app.classList.contains("sb-open-mobile")) toggleSidebar();
    var gs = document.getElementById("global-search");
    if (gs) { gs.focus(); gs.select(); }
    return;
  }
  if (e.key === "Escape") {
    closeCtxMenu();
    var mb = document.getElementById("modal-bg");
    if (mb && mb.classList.contains("show")) { closeModal(); return; }
    var b = document.getElementById("in-search");
    if (b && b.classList.contains("show")) { toggleInSearch(); return; }
    document.getElementById("bm-drop").classList.remove("show");
  }
});
`;
}
