export const FILE_CATEGORIES = {
  text: {
    ext: ["txt","md","markdown","json","js","mjs","ts","jsx","tsx","py","rb","go","rs","java","c","cpp","cc","h","hpp","cs","css","scss","html","htm","xml","yaml","yml","toml","ini","conf","env","sh","bash","zsh","sql","php","swift","kt","scala","lua","r","pl","vim","log","csv","tsv","gitignore","dockerfile","makefile"],
    es: "texto y código", en: "text and code"
  },
  image: {
    ext: ["png","jpg","jpeg","gif","webp","bmp","svg"],
    es: "imágenes", en: "images"
  },
  pdf: {
    ext: ["pdf"],
    es: "PDF", en: "PDF"
  },
  zip: {
    ext: ["zip","tar","gz","7z","rar"],
    es: "comprimidos", en: "compressed"
  }
};

export const MODELS = {
  "@cf/zai-org/glm-4.7-flash": {
    name: "GLM 4.7 Flash", creator: "Zhipu AI (Z.ai)", year: "2025",
    oriented_es: "Chat rápido y respuestas inmediatas. Ideal para uso diario y conversaciones casuales.",
    oriented_en: "Fast chat and immediate responses. Ideal for daily use and casual conversations.",
    strengths_es: ["Muy rápido", "Eficiente en neuronas", "Ideal para uso diario", "Bueno en multilingüe"],
    strengths_en: ["Very fast", "Neuron efficient", "Ideal for daily use", "Good multilingual"],
    weaknesses_es: ["Razonamiento limitado", "Menos preciso en tareas complejas", "No ideal para programación avanzada"],
    weaknesses_en: ["Limited reasoning", "Less precise in complex tasks", "Not ideal for advanced programming"],
    nIn: 3000, nOut: 10000, convDay: 4348,
    fileTypes: ["text"]
  },
  "@cf/google/gemma-4-26b-a4b-it": {
    name: "Gemma 4 26B", creator: "Google", year: "2025",
    oriented_es: "Chat general balanceado. Buena relación calidad/velocidad.",
    oriented_en: "Balanced general chat. Good quality/speed ratio.",
    strengths_es: ["Balance calidad/velocidad", "Multilingüe", "Bueno para resúmenes"],
    strengths_en: ["Quality/speed balance", "Multilingual", "Good for summaries"],
    weaknesses_es: ["Menos capaz que modelos grandes", "Razonamiento limitado en tareas complejas"],
    weaknesses_en: ["Less capable than large models", "Limited reasoning in complex tasks"],
    nIn: 9091, nOut: 27273, convDay: 1563,
    fileTypes: ["text"]
  },
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast": {
    name: "Llama 3.3 70B", creator: "Meta", year: "2024-2025",
    oriented_es: "Razonamiento complejo, programación, análisis, escritura. El más versátil.",
    oriented_en: "Complex reasoning, programming, analysis, writing. The most versatile.",
    strengths_es: ["Excelente razonamiento", "Muy bueno en código", "Versátil", "Gran contexto"],
    strengths_en: ["Excellent reasoning", "Very good at code", "Versatile", "Large context"],
    weaknesses_es: ["Consume muchas neuronas", "Más lento", "~229 conversaciones/día"],
    weaknesses_en: ["Consumes many neurons", "Slower", "~229 conversations/day"],
    nIn: 26668, nOut: 204805, convDay: 229,
    fileTypes: ["text"]
  },
  "@cf/nvidia/nemotron-3-120b-a12b": {
    name: "Nemotron 3 120B", creator: "NVIDIA", year: "2025",
    oriented_es: "Tareas avanzadas, razonamiento profundo, análisis complejo.",
    oriented_en: "Advanced tasks, deep reasoning, complex analysis.",
    strengths_es: ["Alto rendimiento", "Razonamiento profundo", "Gran contexto"],
    strengths_en: ["High performance", "Deep reasoning", "Large context"],
    weaknesses_es: ["Consume muchas neuronas", "Más lento", "~314 conversaciones/día"],
    weaknesses_en: ["Consumes many neurons", "Slower", "~314 conversations/day"],
    nIn: 45455, nOut: 136364, convDay: 314,
    fileTypes: ["text"]
  }
};

export function resolveModel(key, extModels) {
  if (typeof key !== "string") return null;
  if (key.startsWith("ext:")) {
    const id = key.slice(4);
    const m = (extModels || []).find(x => x.id === id);
    if (!m) return null;
    return {
      id: m.id, name: m.name || m.modelId,
      creator: m.provider === "anthropic" ? "Anthropic" : (m.provider || "ext"),
      year: "ext", fileTypes: m.fileTypes || ["text"],
      nIn: m.nIn || 0, nOut: m.nOut || 0,
      external: true, modelId: m.modelId, provider: m.provider,
      baseUrl: m.baseUrl, apiKey: m.apiKey
    };
  }
  const m = MODELS[key];
  return m ? Object.assign({}, m, { external: false }) : null;
}

export function modelCats(key, extModels) {
  const m = resolveModel(key, extModels);
  return m && m.fileTypes ? m.fileTypes : ["text"];
}

export function fileCategory(name, mime) {
  const ext = String(name || "").toLowerCase().split(".").pop();
  const base = String(mime || "").toLowerCase();
  for (const cat of Object.keys(FILE_CATEGORIES)) {
    const def = FILE_CATEGORIES[cat];
    if (def.ext.includes(ext)) return cat;
    if (cat === "image" && base.startsWith("image/")) return "image";
    if (cat === "pdf" && base === "application/pdf") return "pdf";
    if (cat === "zip" && base.includes("zip")) return "zip";
  }
  if (base.startsWith("text/")) return "text";
  if (["application/json","application/javascript","application/xml"].includes(base)) return "text";
  return null;
}

export function modelAcceptsFile(key, name, mime, extModels) {
  const cat = fileCategory(name, mime);
  return cat ? modelCats(key, extModels).includes(cat) : false;
}

export function acceptForModel(key, extModels) {
  const cats = modelCats(key, extModels);
  const out = [];
  for (const c of cats) {
    const def = FILE_CATEGORIES[c];
    if (def) out.push(...def.ext);
  }
  return out.map(e => "." + e).join(",");
}

export function catLabels(lang, cats) {
  return cats.map(c => {
    const def = FILE_CATEGORIES[c];
    return def ? (lang === "en" ? def.en : def.es) : c;
  }).join(" · ");
}

export function estimateNeurons(model, inputTokens, outputTokens) {
  const m = MODELS[model] || MODELS["@cf/zai-org/glm-4.7-flash"];
  return (inputTokens * m.nIn + outputTokens * m.nOut) / 1000000;
}

export function getModelsForFrontend(lang) {
  const result = {};
  for (const [key, m] of Object.entries(MODELS)) {
    result[key] = {
      name: m.name, creator: m.creator, year: m.year,
      oriented: lang === "en" ? m.oriented_en : m.oriented_es,
      strengths: lang === "en" ? m.strengths_en : m.strengths_es,
      weaknesses: lang === "en" ? m.weaknesses_en : m.weaknesses_es,
      convDay: m.convDay, nIn: m.nIn, nOut: m.nOut,
      fileTypes: m.fileTypes,
      fileLabels: catLabels(lang, m.fileTypes)
    };
  }
  return result;
}
