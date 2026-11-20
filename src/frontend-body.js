export function getHtmlBody(t) {
  return `
<body>
<div id="app">
  <div id="sidebar">
    <div class="sidebar-header">
      <div class="dot"></div>
      <h1>${t.app_name}</h1>
      <button id="new-btn" onclick="newConversation()">${t.new_chat}</button>
    </div>
    <div class="search-wrap">
      <input type="text" id="global-search" placeholder="${t.search_all}" oninput="doGlobalSearch(this.value)">
    </div>
    <div id="bm-section" style="display:none">
      <div class="section-label">${t.bookmarks}</div>
      <div id="bm-sidebar-list"></div>
    </div>
    <div id="conv-list"></div>
  </div>
  <div id="main">
    <div class="topbar">
      <button id="menu-btn" onclick="toggleSidebar()">☰</button>
      <select id="model" onchange="changeModel(this.value)"></select>
      <div class="chip" id="status-chip"><div class="spin" id="status-spin" style="display:none"></div><b id="status-model">—</b><span id="status-state"></span></div>
      <div class="tb-actions">
        <div class="usage-wrap">
          <div class="usage-bar"><div class="usage-fill" id="usage-fill"></div></div>
          <span class="usage-text" id="usage-text">—</span>
        </div>
        <button class="icon-btn" onclick="openFilesPanel()">📁</button>
        <div id="bm-wrap">
          <button class="icon-btn" id="bm-toggle" onclick="toggleBmDrop()">🔗</button>
          <div id="bm-drop"></div>
        </div>
        <button class="icon-btn" onclick="showNews()" style="position:relative">📢<span class="news-dot" id="news-dot" style="display:none"></span></button>
        <button class="icon-btn" onclick="showGuide()">📖</button>
        <button class="icon-btn" onclick="openSettings()">⚙️</button>
        <button class="icon-btn" onclick="toggleInSearch()">🔎</button>
        <button id="logout-btn" class="icon-btn danger" onclick="doLogout()" style="display:none">${t.logout}</button>
      </div>
    </div>
    <div id="in-search">
      <input type="text" id="in-search-input" placeholder="${t.search_in_placeholder}" oninput="doInSearch(this.value)">
      <span class="count" id="in-search-count"></span>
      <button onclick="toggleInSearch()" style="background:none;color:var(--muted);font-size:18px;padding:4px">✕</button>
    </div>
    <div id="chat">
      <div class="empty">${t.empty_chat} <b>${t.new_chat}</b> ${t.empty_chat_start}</div>
    </div>
    <div class="file-chips" id="file-chips"></div>
    <div class="upload-progress" id="upload-progress"></div>
    <div id="input-area">
      <button id="upload-btn" onclick="document.getElementById('file-input').click()">📎</button>
      <input type="file" id="file-input" multiple>
      <textarea id="input" rows="1" placeholder="${t.write_message}"></textarea>
      <button id="clear" onclick="clearChat()">🗑</button>
      <button id="send" onclick="sendMessage()">➤</button>
    </div>
  </div>
</div>
<div class="overlay" id="overlay" onclick="closeMobileSidebar()"></div>
<div class="ctx-menu" id="ctx-menu"></div>
<div class="modal-bg" id="modal-bg" onclick="if(event.target===this)closeModal()">
  <div class="modal" id="modal-content"></div>
</div>
`;
}
