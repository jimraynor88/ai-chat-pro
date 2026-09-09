export const CSS2 = `
.ctx-menu{position:fixed;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:6px;min-width:190px;max-width:min(280px,90vw);max-height:70vh;overflow-y:auto;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.4);display:none}
.ctx-menu.show{display:block}
.ctx-menu button{display:flex;align-items:center;gap:8px;width:100%;background:none;padding:8px 12px;border-radius:6px;font-size:13px;text-align:left}
.ctx-menu button:hover{background:var(--bg)}
.ctx-menu .sep{height:1px;background:var(--border);margin:4px 0}
.ctx-menu .hint{font-size:11px;color:var(--muted);padding:4px 12px}
.color-row{display:flex;gap:4px;padding:4px 12px 8px;flex-wrap:wrap}
.swatch{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent}
.swatch.active{border-color:var(--text)}
.swatch.none{background:var(--border)} .swatch.red{background:var(--red)} .swatch.blue{background:var(--blue)}
.swatch.green{background:var(--green)} .swatch.yellow{background:var(--yellow)}
.swatch.purple{background:var(--purple)} .swatch.orange{background:var(--orange)} .swatch.pink{background:var(--pink)}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:300;display:none;align-items:center;justify-content:center;padding:16px}
.modal-bg.show{display:flex}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);max-width:min(640px,100%);width:100%;max-height:85dvh;overflow-y:auto;padding:clamp(16px,3vw,24px)}
.modal h2{font-size:17px;margin-bottom:14px}
.modal-close{float:right;background:none;font-size:22px;padding:0 4px;color:var(--muted)}
.modal-close:hover{color:var(--text)}
.input-prompt{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:14px;margin:6px 0}
.input-prompt:focus{border-color:var(--accent)}
.btn-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.btn-row button{padding:9px 16px;border-radius:8px;font-size:14px;font-weight:600;min-height:40px}
.btn-primary{background:var(--accent);color:#fff}
.btn-secondary{background:var(--bg);border:1px solid var(--border)}
.folder-select{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:8px 10px;font-size:13px;margin:6px 0}
.search-result{padding:10px;border-radius:8px;background:var(--bg);border:1px solid var(--border);margin-bottom:8px;cursor:pointer}
.search-result:hover{border-color:var(--accent)}
.sr-title{font-size:13px;font-weight:600}
.sr-snippet{font-size:12px;color:var(--muted);margin-top:4px}
.sr-snippet mark,.msg mark{background:var(--yellow);color:#000;border-radius:2px}
.tabs{display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap}
.tabs button{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px}
.tabs button.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.f-label{display:block;font-size:12px;color:var(--muted);margin:10px 0 4px;font-weight:600}
.f-info{font-size:12px;color:var(--muted);margin:8px 0;padding:8px 10px;background:var(--bg);border:1px solid var(--border);border-radius:8px}
.ext-model{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px}
.file-row{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--bg);border:1px solid var(--border);margin-bottom:6px;font-size:13px;flex-wrap:wrap}
.file-row .f-name{flex:1;min-width:100px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-row .f-meta{font-size:11px;color:var(--muted);flex-basis:100%}
.model-card{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px}
.model-card h3{font-size:15px;margin-bottom:4px}
.model-card .creator{font-size:12px;color:var(--muted);margin-bottom:6px}
.model-card .oriented{font-size:13px;margin-bottom:8px}
.model-card .label{font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin:8px 0 4px}
.model-card ul{list-style:none;padding:0}
.model-card li{font-size:13px;padding:2px 0;display:flex;align-items:center;gap:6px}
.model-card .ok{color:var(--green)} .model-card .bad{color:var(--red)}
.model-card .stats{display:flex;gap:14px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);flex-wrap:wrap}
.model-card .stat{font-size:12px;color:var(--muted)}
.model-card .stat b{color:var(--text);font-size:14px}
.model-card .files-line{font-size:12px;color:var(--blue);margin-top:6px}
@media(max-width:480px){.modal{padding:14px}.msg{font-size:14px}}
.news-dot{position:absolute;top:2px;right:2px;width:8px;height:8px;border-radius:50%;background:var(--accent)}
.news-item{display:flex;gap:10px;padding:10px 12px;border-radius:8px;background:var(--bg);border:1px solid var(--border);margin-bottom:8px;cursor:pointer}
.news-item.unread{border-color:var(--accent)}
.news-item .ni-title{font-size:14px;color:var(--muted)}
.news-item.unread .ni-title{color:var(--accent);font-weight:700}
.news-item .ni-sub{font-size:12px;color:var(--muted);margin-top:2px}
.news-item .ni-date{font-size:11px;color:var(--muted);margin-left:auto;white-space:nowrap;flex-shrink:0;align-self:flex-start}
`;
