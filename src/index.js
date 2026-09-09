import { getModelsForFrontend, acceptForModel, catLabels, resolveModel } from "./models.js";
import { sha256, makeCookie, checkAuth, getLoginHTML } from "./auth.js";
import { getLang, getFrontendStrings, translations, DEFAULT_LANG } from "./i18n.js";
import { getHtmlHead } from "./frontend-html.js";
import { getFrontendJs } from "./frontend-js.js";
import { loadSettings, saveSettings } from "./settings.js";
import { getState, createConversation, getConversation, updateConversation, deleteConversation, chat } from "./conversations.js";
import { uploadFile } from "./files.js";
import { listFiles, shareFile, detachFile, getBlob } from "./files-index.js";
import { runCleanup } from "./files-cleanup.js";
import { testExternal } from "./storage-external.js";
import { runExternal } from "./models-external.js";
import { createFolder, updateFolder, deleteFolder } from "./folders.js";
import { searchConversations } from "./search.js";
import { listBookmarks, addBookmark, updateBookmark, deleteBookmark } from "./bookmarks.js";
import { exportTxt, exportMd, exportHtml } from "./export.js";
import { importConversations } from "./import.js";
import { getNews } from "./news.js";

function getT(lang) {
  return translations[lang] || translations[DEFAULT_LANG];
}


function normalizeExtModel(b) {
  const fileTypes = (b.fileTypes || ["text"]).slice();
  if (b.acceptsImage && fileTypes.indexOf("image") < 0) fileTypes.push("image");
  return {
    id: b.id || crypto.randomUUID(),
    name: b.name || b.modelId || "Modelo externo",
    provider: b.provider || "openai",
    modelId: b.modelId || "",
    baseUrl: b.baseUrl || "",
    apiKey: b.apiKey || "",
    fileTypes,
    nIn: b.nIn || 0,
    nOut: b.nOut || 0,
    costIn: b.costIn || 0,
    costOut: b.costOut || 0,
    dailyLimit: b.dailyLimit || 0
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const lang = getLang(env);
    const tt = getT(lang);

    if (method === "POST" && path === "/api/login") {
      const body = await request.json();
      if (body.password === env.AUTH_PASSWORD) {
        const token = await sha256(env.AUTH_PASSWORD + (env.AUTH_SECRET || "fallback-secret"));
        return new Response(JSON.stringify({ ok: true }), {
          headers: { "Content-Type": "application/json", "Set-Cookie": makeCookie("auth_token", token, 86400) }
        });
      }
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (method === "POST" && path === "/api/logout") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json", "Set-Cookie": makeCookie("auth_token", "", 0) }
      });
    }

    if (env.AUTH_PASSWORD) {
      const authed = await checkAuth(request, env);
      if (!authed) {
        if (method === "GET" && path === "/") return new Response(getLoginHTML(tt), { headers: { "Content-Type": "text/html; charset=utf-8" } });
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const settings = await loadSettings(env);

    if (method === "GET" && path === "/") {
      const html = getHtmlHead(tt) + getFrontendJs();
      const injected = html.replace(
        "<script>",
        "<script>window.__T=" + getFrontendStrings(lang) + ";window.__MI=" + JSON.stringify(getModelsForFrontend(lang)) + ";window.__SET=" + JSON.stringify({
          retention: settings.retention,
          storageType: settings.storageExt.type,
          modelsExt: (settings.modelsExt || []).map(m => ({ id: m.id, name: m.name, modelId: m.modelId, provider: m.provider, fileTypes: m.fileTypes || ["text"], nIn: m.nIn || 0, nOut: m.nOut || 0, costIn: m.costIn || 0, costOut: m.costOut || 0, dailyLimit: m.dailyLimit || 0 }))
        }) + ";</script>\n<script>"
      );
      return new Response(injected, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (method === "GET" && path === "/api/state") return getState(env, settings);
    if (method === "POST" && path === "/api/conversation") return createConversation(request, env);
    if (method === "POST" && path === "/api/search") return searchConversations(request, env);
    if (method === "POST" && path === "/api/folder") return createFolder(request, env);
    if (method === "POST" && path === "/api/import") return importConversations(request, env);
    if (method === "GET" && path === "/api/news") return Response.json({ items: await getNews() });
    if (method === "POST" && path === "/api/news/read") {
      const body = await request.json();
      const cur = await loadSettings(env);
      const read = Array.isArray(cur.readNews) ? cur.readNews : [];
      if (body.all) {
        const ids = (await getNews()).map(n => n.id);
        cur.readNews = Array.from(new Set([...read, ...ids]));
      } else if (typeof body.id === "string") {
        cur.readNews = Array.from(new Set([...read, body.id]));
      }
      await saveSettings(env, cur);
      return Response.json({ ok: true, readNews: cur.readNews });
    }
    if (method === "GET" && path === "/api/bookmarks") return listBookmarks(env);
    if (method === "POST" && path === "/api/bookmark") return addBookmark(request, env);
    if (method === "GET" && path === "/api/files") return listFiles(env);
    if (method === "POST" && path === "/api/files/share") return shareFile(request, env);
    if (method === "POST" && path === "/api/files/detach") return detachFile(request, env);

    let m = path.match(/^\/api\/files\/blob\/([0-9a-f]{64})$/);
    if (m && method === "GET") return getBlob(request, env, m[1], settings);

    m = path.match(/^\/api\/files\/accept\/(.+)$/);
    if (m && method === "GET") {
      const modelKey = decodeURIComponent(m[1]);
      const meta = resolveModel(modelKey, settings.modelsExt) || { fileTypes: ["text"] };
      return Response.json({ accept: acceptForModel(modelKey, settings.modelsExt), cats: catLabels(lang, meta.fileTypes) });
    }

    m = path.match(/^\/api\/upload\/(.+)$/);
    if (m && method === "POST") return uploadFile(request, env, settings, decodeURIComponent(m[1]), url.searchParams.get("conv") || null);
    if (method === "POST" && path === "/api/upload") return uploadFile(request, env, settings, null);

    if (method === "POST" && path === "/api/settings") {
      const body = await request.json();
      const cur = await loadSettings(env);
      const next = {
        retention: body.retention !== undefined ? body.retention : cur.retention,
        defaultModel: body.defaultModel !== undefined ? body.defaultModel : cur.defaultModel,
        modelPrompts: body.modelPrompts !== undefined && typeof body.modelPrompts === "object" ? body.modelPrompts : cur.modelPrompts,
        storageExt: Object.assign({}, cur.storageExt, body.storageExt || {}),
        modelsExt: Array.isArray(body.modelsExt) ? body.modelsExt : cur.modelsExt
      };
      const saved = await saveSettings(env, next);
      return Response.json({ ok: true });
    }
    if (method === "POST" && path === "/api/settings/storage") {
      const body = await request.json();
      const cur = await loadSettings(env);
      const curSt = cur.storageExt;
      const st = body.storageExt || {};
      cur.storageExt = {
        type: st.type !== undefined ? st.type : curSt.type,
        endpoint: st.endpoint !== undefined ? st.endpoint : curSt.endpoint,
        region: st.region !== undefined ? st.region : curSt.region,
        bucket: st.bucket !== undefined ? st.bucket : curSt.bucket,
        publicUrl: st.publicUrl !== undefined ? st.publicUrl : curSt.publicUrl,
        accessKey: st.accessKey ? st.accessKey : curSt.accessKey,
        secretKey: st.secretKey ? st.secretKey : curSt.secretKey,
        user: st.user ? st.user : curSt.user,
        pass: st.pass ? st.pass : curSt.pass
      };
      await saveSettings(env, cur);
      return Response.json({ ok: true });
    }

    if (method === "POST" && path === "/api/settings/model-add") {
      const body = await request.json();
      const cur = await loadSettings(env);
      cur.modelsExt = cur.modelsExt || [];
      cur.modelsExt.push(normalizeExtModel(body));
      await saveSettings(env, cur);
      return Response.json({ ok: true, id: cur.modelsExt[cur.modelsExt.length - 1].id });
    }

    if (method === "POST" && path === "/api/settings/model-update") {
      const body = await request.json();
      const cur = await loadSettings(env);
      const m = (cur.modelsExt || []).find(x => x.id === body.id);
      if (!m) return Response.json({ error: "notfound" }, { status: 404 });
      for (const k of ["name", "modelId", "costIn", "costOut", "dailyLimit", "fileTypes"]) {
        if (body[k] !== undefined) m[k] = body[k];
      }
      if (body.apiKey) m.apiKey = body.apiKey;
      if (body.baseUrl) m.baseUrl = body.baseUrl;
      await saveSettings(env, cur);
      return Response.json({ ok: true });
    }

    if (method === "POST" && path === "/api/settings/model-delete") {
      const body = await request.json();
      const cur = await loadSettings(env);
      cur.modelsExt = (cur.modelsExt || []).filter(x => x.id !== body.id);
      await saveSettings(env, cur);
      return Response.json({ ok: true });
    }

    
    if (method === "POST" && path === "/api/settings/storage-test") {
      const body = await request.json();
      return Response.json(await testExternal(body.storageExt || {}));
    }

    if (method === "POST" && path === "/api/settings/model-test") {
      const body = await request.json();
      const ext = { provider: body.provider, modelId: body.modelId, baseUrl: body.baseUrl, apiKey: body.apiKey };
      try {
        const r = await runExternal(ext, [{ role: "user", content: "Responde solo: OK" }]);
        return Response.json({ ok: true, response: String(r.response).slice(0, 200) });
      } catch (e) {
        return Response.json({ ok: false, error: e.message });
      }
    }

    m = path.match(/^\/api\/conversation\/([^/]+)\/(.+)$/);
    if (m) {
      const id = m[1], action = m[2];
      if (action === "get" && method === "GET") return getConversation(env, id);
      if (action === "update" && method === "POST") return updateConversation(request, env, id);
      if (action === "delete" && method === "POST") return deleteConversation(env, id);
      if (action === "chat" && method === "POST") return chat(request, env, id, settings);
      if (action === "export" && method === "GET") {
        const res = await getConversation(env, id);
        const conv = await res.json();
        const fmt = url.searchParams.get("format") || "txt";
        if (fmt === "md") return exportMd(conv);
        if (fmt === "html") return exportHtml(conv);
        return exportTxt(conv);
      }
    }

    m = path.match(/^\/api\/folder\/([^/]+)\/(.+)$/);
    if (m) {
      const id = m[1], action = m[2];
      if (action === "update" && method === "POST") return updateFolder(request, env, id);
      if (action === "delete" && method === "POST") return deleteFolder(env, id);
    }

    m = path.match(/^\/api\/bookmark\/([^/]+)\/(.+)$/);
    if (m) {
      const id = m[1], action = m[2];
      if (action === "update" && method === "POST") return updateBookmark(request, env, id);
      if (action === "delete" && method === "POST") return deleteBookmark(env, id);
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(_controller, env) {
    const settings = await loadSettings(env);
    await runCleanup(env, settings);
  }
};
