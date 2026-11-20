export const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{
--bg:#0b0d10;--surface:#15181d;--surface2:#1c2026;--border:#2a2e36;--text:#e4e7eb;
--muted:#8b94a3;--accent:#f6821f;--user:#1c2128;--ai:#15181d;--green:#22c55e;
--red:#f87171;--yellow:#fbbf24;--blue:#60a5fa;--purple:#a78bfa;--pink:#f472b6;--orange:#fb923c;
--r:10px;--r-lg:14px;--sbw:clamp(240px,24vw,300px);--tap:44px
}
html,body{height:100%;overflow:hidden}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--text);font-size:15px;display:flex;height:100dvh}
button{font-family:inherit;cursor:pointer;border:none;outline:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:inherit}
::selection{background:var(--accent);color:#fff}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:4px}
#app{display:grid;grid-template-columns:var(--sbw) minmax(0,1fr);width:100%;height:100%;transition:grid-template-columns .3s ease}
#app.sb-closed{grid-template-columns:0 minmax(0,1fr)}
#app.sb-closed #sidebar{opacity:0;pointer-events:none;transform:translateX(-12px)}
#sidebar{background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;min-width:0;overflow:hidden;transition:opacity .3s ease,transform .3s ease}
.sidebar-header{padding:12px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
.sidebar-header .dot{width:9px;height:9px;border-radius:50%;background:var(--green);flex-shrink:0}
.sidebar-header h1{font-size:clamp(14px,1.4vw,16px);font-weight:700;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#new-btn{background:var(--accent);color:#fff;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;white-space:nowrap;min-height:34px}
#new-btn:hover{opacity:.85}
.search-wrap{padding:10px 12px;border-bottom:1px solid var(--border)}
.search-wrap input{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px}
.search-wrap input:focus{border-color:var(--accent)}
#conv-list{flex:1;overflow-y:auto;padding:8px}
.section-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;padding:8px 12px 4px;font-weight:600}
.conv-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;cursor:pointer;position:relative;margin-bottom:2px}
.conv-item:hover{background:var(--surface2)}
.conv-item.active{background:var(--surface2);box-shadow:inset 3px 0 0 var(--accent);padding-left:9px}
.conv-item.pinned::after{content:'📌';position:absolute;right:32px;top:8px;font-size:10px}
.conv-color{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.conv-color.none{background:var(--border)} .conv-color.red{background:var(--red)} .conv-color.blue{background:var(--blue)}
.conv-color.green{background:var(--green)} .conv-color.yellow{background:var(--yellow)}
.conv-color.purple{background:var(--purple)} .conv-color.orange{background:var(--orange)} .conv-color.pink{background:var(--pink)}
.conv-info{flex:1;min-width:0}
.conv-title{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500}
.conv-preview{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.conv-time{font-size:10px;color:var(--muted);flex-shrink:0}
.conv-model-icon{font-size:11px;opacity:.7}
.conv-menu-btn{opacity:0;background:none;color:var(--muted);font-size:16px;padding:4px 6px;border-radius:4px;flex-shrink:0;min-width:24px;min-height:24px}
.conv-item:hover .conv-menu-btn{opacity:1}
.conv-menu-btn:hover{color:var(--text);background:var(--bg)}
.folder-conv{margin-left:18px}
.folder-conv.folder-conv{padding-left:28px !important}
.folder-item{padding:8px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:2px;min-height:36px}
.folder-item:hover{background:var(--surface2)}
.folder-icon{font-size:12px;width:14px;text-align:center;flex-shrink:0}
.folder-count{font-size:11px;color:var(--muted);margin-left:auto}
#main{display:flex;flex-direction:column;min-width:0;min-height:0;height:100%} .topbar{padding:8px 14px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;flex-wrap:wrap}
#menu-btn{display:none;background:none;font-size:20px;padding:4px 8px;min-height:var(--tap);min-width:var(--tap)}
.topbar select{background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:13px;cursor:pointer;max-width:44vw}
.topbar select:focus{border-color:var(--accent)}
.chip{display:flex;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--border);border-radius:999px;padding:4px 10px;font-size:12px;color:var(--muted);white-space:nowrap}
.chip b{color:var(--text);font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis}
.chip.busy{border-color:var(--accent);color:var(--accent)}
.chip .spin{width:10px;height:10px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.tb-actions{margin-left:auto;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.usage-wrap{display:flex;align-items:center;gap:8px}
.usage-bar{width:clamp(60px,9vw,130px);height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.usage-fill{height:100%;border-radius:3px;transition:width .3s,background .3s;background:var(--green)}
.usage-text{font-size:12px;color:var(--muted);white-space:nowrap}
.icon-btn{background:none;color:var(--muted);border:1px solid var(--border);border-radius:8px;padding:4px 10px;font-size:15px;min-height:36px}
.icon-btn:hover{color:var(--text);border-color:var(--muted)}
.icon-btn.danger:hover{color:var(--red);border-color:var(--red)}
#bm-wrap{position:relative}
#bm-drop{display:none;position:absolute;top:calc(100% + 6px);right:0;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);min-width:min(300px,80vw);max-height:60vh;overflow-y:auto;z-index:150;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.4)}
#bm-drop.show{display:block}
.bm-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;font-size:13px;cursor:pointer;text-decoration:none;color:var(--text)}
.bm-item:hover{background:var(--bg)}
.bm-item .bm-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bm-item .bm-url{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:45%}
.bm-item.sub{padding-left:26px}
.bm-mgr{background:none;color:var(--muted);font-size:13px;padding:6px 10px;border-radius:6px;width:100%;text-align:left}
.bm-mgr:hover{background:var(--bg);color:var(--text)}
#in-search{display:none;padding:8px 14px;background:var(--surface);border-bottom:1px solid var(--border);align-items:center;gap:8px}
#in-search.show{display:flex}
#in-search input{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:6px 12px;font-size:13px}
#in-search input:focus{border-color:var(--accent)}
#in-search .count{font-size:12px;color:var(--muted);white-space:nowrap}
#chat{flex:1;overflow-y:auto;min-height:0;padding:clamp(12px,3vh,24px) clamp(10px,3vw,24px);display:flex;flex-direction:column;gap:12px} .msg{max-width:85%;padding:10px 14px;border-radius:12px;line-height:1.6;font-size:15px;white-space:pre-wrap;word-break:break-word;position:relative}
.msg.user{align-self:flex-end;background:var(--user);border:1px solid var(--border)}
.msg.ai{align-self:flex-start;background:var(--ai);border:1px solid var(--border)}
.msg.system{align-self:center;background:#1a1f2e;border:1px solid #2a3550;color:var(--muted);font-size:13px;max-width:95%}
.msg.error{align-self:center;background:#2a1518;border:1px solid #5c2a30;color:var(--red);font-size:14px}
.msg img{max-width:220px;max-height:220px;border-radius:8px;margin-top:6px;display:block}
.msg-meta{display:flex;gap:8px;align-items:center;font-size:11px;color:var(--muted);margin-bottom:4px}
.msg-meta .msg-act{opacity:0;background:none;font-size:12px;padding:2px 6px;border-radius:4px;min-height:24px}
.msg:hover .msg-act{opacity:1}
.msg-act:hover{background:var(--surface2);color:var(--text)}
.msg.editing textarea{width:100%;background:var(--bg);border:1px solid var(--accent);border-radius:8px;padding:8px 10px;font-size:14px;min-height:60px;resize:vertical;white-space:pre-wrap}
.typing{align-self:flex-start;color:var(--muted);font-size:14px;padding:8px 16px;display:flex;gap:4px;align-items:center}
.typing span{animation:bounce 1s infinite;display:inline-block}
.typing span:nth-child(2){animation-delay:.15s}
.typing span:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
.queue-badge{align-self:center;font-size:12px;color:var(--yellow);background:var(--surface2);border:1px solid var(--border);border-radius:999px;padding:4px 12px}
.empty{text-align:center;color:var(--muted);padding:40px 20px;font-size:14px}
.file-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 4px;min-height:0;align-items:center}
.file-chip{background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:4px 12px;font-size:12px;display:flex;align-items:center;gap:6px}
.file-chip .remove{cursor:pointer;color:var(--muted);font-weight:bold}
.file-chip .remove:hover{color:var(--red)}
.file-chip img{width:24px;height:24px;border-radius:4px;object-fit:cover}
.file-chip.dup{border-color:var(--green)}
.upload-progress{font-size:12px;color:var(--muted);padding:2px 16px}
#input-area{padding:10px 14px 12px;background:var(--surface);border-top:1px solid var(--border);display:flex;gap:8px;align-items:flex-end}
#input{flex:1;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:15px;resize:none;max-height:140px;line-height:1.5}
#input:focus{border-color:var(--accent)}
#upload-btn{background:var(--bg);color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:8px 12px;font-size:18px;min-height:42px;position:relative}
#upload-btn:hover{color:var(--accent);border-color:var(--accent)}
#upload-btn .lock{position:absolute;top:-6px;right:-6px;font-size:12px}
#send{background:var(--accent);color:#fff;border-radius:10px;padding:0 18px;font-size:15px;font-weight:600;min-height:42px}
#send:disabled{opacity:.4;cursor:not-allowed}
#send:hover:not(:disabled){opacity:.85}
#clear{background:transparent;color:var(--muted);border:1px solid var(--border);border-radius:10px;padding:8px 10px;font-size:15px;min-height:42px}
#clear:hover{color:var(--text)}
#file-input{display:none}
@media(max-width:768px){
:root{--sbw:clamp(280px,86vw,340px)}
#app{grid-template-columns:0 minmax(0,1fr)}
#app.sb-open-mobile #sidebar{position:fixed;inset:0 auto 0 0;width:var(--sbw);z-index:100;opacity:1;transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,.5)}
#menu-btn{display:block}
.msg{max-width:95%;font-size:14px}
.topbar select{max-width:38vw}
.chip b{max-width:110px}
.usage-bar{width:56px}
.hide-sm{display:none !important}
}
@media(min-width:769px){
#app.sb-open-mobile #sidebar{position:static;box-shadow:none}
}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:99;display:none}
.overlay.show{display:block}
@media(prefers-reduced-motion:reduce){
*{animation-duration:.01ms !important;transition-duration:.01ms !important}
}
`;
