export function getJsInit() {
  return `
(function init() {
  fetchState();
  fetchFiles();
  api("/api/bookmarks").then(function(a) { state.bookmarks = a || []; renderBookmarks(); }).catch(function() {});
  api("/api/news").then(function(d) { state.news = d.items || []; renderNewsDot(); }).catch(function() {});
  var ie = document.getElementById("input");
  ie.addEventListener("input", function() {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 140) + "px";
  });
  var isTouch = matchMedia("(pointer: coarse)").matches || ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
  ie.addEventListener("keydown", function(e) {
    if (e.key === "Enter" && !e.shiftKey && (!isTouch || e.ctrlKey)) { e.preventDefault(); sendMessage(); }
  });
})();
`;
}
