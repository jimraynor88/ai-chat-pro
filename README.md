# 🤖 AI Chat Pro v.0.88

Interfaz web de chat con IA que se despliega en Cloudflare Workers en 1 clic.
Gratis, sin servidores, sin tarjeta de crédito, sin conocimientos.

**Modelos incluidos:** GLM 4.7 Flash, Gemma 4 26B, Llama 3.3 70B, Nemotron 3 120B
(gratis, 10.000 Neurons/día) + **modelos externos** que tú añadas (OpenAI,
Anthropic, OpenRouter, Groq, Ollama, Qwen, etc.) con control de consumo igual.

## ✨ Funciones

- **Chat con IA** — modelos gratis de Cloudflare + externos (tú eliges cuáles)
- **Conversaciones persistentes** — en R2, no se pierden
- **Carpetas anidadas** — carpetas dentro de carpetas
- **Renombrar, fijar, colorear** — 8 colores de marcador
- **Búsqueda global** en todas las conversaciones + **búsqueda dentro** de la conversación actual
- **Consumo en tiempo real** — neuronas y tokens restantes, por modelo, siempre visibles
- **Guía de modelos** — creador, año, fortalezas, debilidades y archivos que acepta
- **Archivos sin duplicados** — deduplicación por SHA-256: el mismo archivo se sube 1 vez y se comparte a cualquier conversación, con cualquier modelo
- **Panel de archivos** — qué archivos hay, en qué conversaciones están, y compartirlos desde ahí
- **Tipos de archivo por modelo** — lo que un modelo no soporta no se ofrece en esa conversación
- **Almacenamiento externo** (S3/WebDAV) solo para archivos, como una micro SD extraíble
- **Auto-borrado de archivos** — día, semana, quincena, mes, 6 meses, 1 año o nunca
- **Modelos externos** — API key, coste y límite diario de tokens, medido como los Neurons
- **Cola de mensajes** — si envías mientras se procesa, se encola
- **Editar y copiar** — tus mensajes y los de la IA
- **Timestamp** — día y hora en cada mensaje
- **Sin parseo de markdown** — se ve el texto tal cual, `**negrita**` como está escrito
- **Menús que se cierran solos** tras la acción
- **Enlaces / bookmarks** con submenús, en la barra superior y en el sidebar
- **Exportar conversación** — .txt, .md, .html y PDF (vía impresión del navegador)
- **Atajos de teclado** — Ctrl+K buscar, Esc cerrar, Enter enviar
- **UI adaptativa** — móvil, tablet, PC, cualquier navegador
- **Protección por contraseña** + Cloudflare Access
- **Tema oscuro**

## 🚀 Desplegar en 1 clic

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jimraynor88/ai-chat-pro)

Al pulsar el botón:

1. Cloudflare clona el repo a tu cuenta de GitHub
2. Crea el bucket R2 `ia-chat` automáticamente
3. Configura los bindings AI + R2
4. Te pide 3 campos:

| Campo | Qué poner |
|-------|-----------|
| `AUTH_PASSWORD` | Tu contraseña. Vacío = acceso libre (sin protección) |
| `AUTH_SECRET` | Cadena aleatoria larga. Genera una con `openssl rand -hex 32` o en un generador de contraseñas. **Imprescindible**: con ella se cifra la configuración en R2 |
| `EX_KEY_EJEMPLO` | **Deja vacío.** Es un ejemplo de patrón para secrets avanzados, no se usa |

5. Despliega y te da la URL lista para usar

## 🔐 Seguridad: la filosofía de la micro SD

Piensa en un móvil. El sistema operativo vive en la memoria interna, la micro SD
solo guarda fotos y vídeos extraíbles. Este proyecto igual:

- **R2 propio = memoria interna.** Conversaciones, carpetas, historial y ajustes.
  Nunca sale de tu cuenta de Cloudflare, siempre bajo tu control.
- **Storage externo = micro SD.** Solo los blobs de archivos compartidos. Se puede
  quitar, nunca guarda nada estructural tuyo.

### ¿Dónde viven los datos sensibles?

Las API keys de modelos externos y las credenciales de storage externo se guardan
**cifradas (AES-256-GCM)** en `ajustes/config.json` dentro de tu R2:

- La llave de cifrado deriva de tu `AUTH_SECRET`
- Solo el Worker puede descifrarla
- La configuras y cambias desde el **panel de settings** de la interfaz, sin redeploy
- Si `AUTH_SECRET` está vacío el cifrado es débil: ponla siempre

> Usuarios avanzados: también puedes definir estas credenciales como secrets de
> Cloudflare con el patrón `EX_*` (mira el ejemplo `EX_KEY_EJEMPLO`). Un secret
> de CF, si existe, tiene prioridad sobre la config de R2.

### Protección de la interfaz (3 métodos)

Sin protección, cualquiera con la URL puede usar tu chat y gastar tus Neurons.

#### Método 1: Contraseña (⭐ Muy fácil — 2 min)

1. Dashboard de Cloudflare → tu Worker
2. **Settings → Variables and Secrets**
3. Añade 2 secrets:

| Nombre | Valor |
|--------|-------|
| `AUTH_PASSWORD` | Tu contraseña |
| `AUTH_SECRET` | Cadena aleatoria (`openssl rand -hex 32`) |

Al abrir la URL aparece el login. Con `AUTH_PASSWORD` vacío, el chat es público.

#### Método 2: Cloudflare Access con OTP por email (⭐⭐ Fácil — 5 min)

Pantalla de login de Cloudflare delante del Worker. Gratis hasta 50 usuarios, sin código.

1. Ve a [Zero Trust](https://dash.cloudflare.com/?to=/:account/zero-trust). Si es la primera vez, elige nombre de equipo y plan **Free**
2. **Settings → Authentication → Login methods → Add new → One-time PIN**
3. **Access → Applications → Add an application → Self-hosted**
   - Application domain: `tu-worker.tu-subdominio.workers.dev`
   - Identity provider: One-time PIN
4. Crea una **Policy**: Action **Allow**, Include: tu email

Al abrir la URL, Cloudflare pide tu email, te manda un PIN de 6 dígitos y entras.
Para añadir personas, edita la política e incluye sus emails.

#### Método 3: Cloudflare Access con Google/GitHub/Microsoft (⭐⭐⭐ Intermedio — 10 min)

Igual que el Método 2, pero en **Login methods** añades tu proveedor (Google,
GitHub, Microsoft) con su Client ID y Client Secret, y en la política puedes
permitir emails individuales o dominios enteros (`@tudominio.com`).

| Método | Dificultad | Para quién | Costo |
|--------|-----------|------------|-------|
| Contraseña | ⭐ | Uso personal | Gratis |
| OTP por email | ⭐⭐ | Compartir con pocos | Gratis (50 usuarios) |
| Google/GitHub | ⭐⭐⭐ | Equipos | Gratis (50 usuarios) |

## 📦 Almacenamiento externo (archivos)

Para no saturar el R2 de 10 GB, los archivos adjuntos pueden vivir fuera:

- **S3-compat** (SigV4): R2 de otra cuenta, Backblaze B2, MinIO, iDrive, DigitalOcean Spaces, Wasabi, cualquier S3
- **WebDAV** (auth básica): Nextcloud, tu propio servidor, etc.
- **No hay FTP**: los Workers no tienen sockets TCP, es imposible

Se configura en **Settings → Almacenamiento externo** (tipo, endpoint, región,
bucket, credenciales, URL pública). Sin redeploy. Si no lo configuras, todo vive
en tu R2 y no pasa nada.

## 🤖 Modelos externos

En **Settings → Modelos externos** puedes añadir:

- **OpenAI-compat**: OpenAI, OpenRouter, Groq, Together, HuggingFace, Ollama (local), vLLM, Qwen/DashScope, etc. Solo base URL + API key + nombre de modelo
- **Anthropic**: API key + modelo

Cada modelo externo lleva su propio control: coste por millón de tokens
(entrada/salida) y/o límite diario de tokens, y el medidor lo muestra igual que
los Neurons de Cloudflare. El selector de modelos muestra todos, CF y externos, agrupados.

## 🧹 Auto-borrado de archivos

En **Settings → Retención** eliges la edad máxima de los archivos adjuntos:

`No borrar · 1 día · 7 días · 14 días · 30 días · 183 días · 365 días`

- El purgado corre a diario (00:10 UTC)
- **Solo toca archivos**, jamás conversaciones ni carpetas
- Si un archivo purgado estaba en una conversación, esta muestra "archivo purgado"

## 🔗 Enlaces / bookmarks

Zona para tus enlaces: otros proyectos, URLs de pago, tu web, artículos,
historial de versiones, lo que quieras.

- Icono en la **barra superior** con desplegable rápido
- Lista colapsable en el **sidebar**
- Soporta **submenús** (enlaces dentro de enlaces)
- Se gestiona desde el panel: añadir, editar, ordenar, borrar

## 📤 Exportar conversación

Cada conversación se exporta a:

- `.txt` — texto plano
- `.md` — markdown
- `.html` — con formato, se abre en cualquier navegador
- **PDF** — se genera el `.html` y lo imprimes a PDF desde el navegador

## ⌨️ Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `Ctrl+K` | Búsqueda global |
| `Enter` | Enviar (en móvil, `Ctrl+Enter`) |
| `Esc` | Cerrar menú, modal o búsqueda |

## 📁 Estructura del proyecto

```
ai-chat-pro2/
├── src/
│   ├── index.js              ← Router principal
│   ├── models.js             ← Modelos CF + tipos de archivo + neuronas
│   ├── models-external.js    ← Llamada a proveedores externos
│   ├── auth.js               ← Autenticación + login HTML
│   ├── i18n.js               ← Traducciones es/en
│   ├── settings.js           ← Config cifrada en R2
│   ├── conversations.js      ← CRUD conversaciones + chat
│   ├── folders.js            ← CRUD carpetas anidadas
│   ├── files.js              ← Subida + dedup SHA-256
│   ├── files-index.js        ← Panel de archivos + compartir
│   ├── files-cleanup.js      ← Purgado por tiempo
│   ├── storage-external.js   ← S3 (SigV4) / WebDAV
│   ├── bookmarks.js          ← CRUD enlaces
│   ├── export.js             ← txt / md / html
│   ├── import.js             ← Importar desde otras IA
│   ├── util.js               ← Helpers compartidos
│   ├── search.js             ← Búsqueda global
│   ├── frontend-css.js       ← Estilos (layout fluido)
│   ├── frontend-css-2.js     ← Estilos (modales, paneles)
│   ├── frontend-body.js      ← HTML de estructura
│   ├── frontend-html.js      ← Ensamblador
│   ├── frontend-state.js     ← Estado + helpers
│   ├── frontend-sidebar.js   ← Sidebar + menús
│   ├── frontend-chat.js      ← Chat, cola, editar, copiar
│   ├── frontend-files.js     ← Upload + panel archivos
│   ├── frontend-usage.js     ← Consumo en tiempo real
│   ├── frontend-settings.js  ← Panel de settings
│   ├── frontend-guide.js     ← Guía de modelos
│   ├── frontend-import.js    ← Import desde otras IA
│   ├── frontend-shortcuts.js ← Atajos
│   └── frontend-init.js      ← Init
├── .github/workflows/deploy.yml
├── wrangler.toml
├── package.json
├── .dev.vars.example
└── LICENSE 
```

## 📁 Estructura de R2

```
ia-chat/
├── conversaciones/
│   ├── index:conversations   ← Índice de conversaciones
│   ├── index:folders         ← Índice de carpetas (con parentId)
│   ├── conv:<uuid>           ← Datos de cada conversación
│   └── usage:YYYY-MM-DD      ← Uso diario (neurons)
├── ajustes/
│   ├── config.json           ← Config CIFRADA (retención, storage-ext, modelos-ext)
│   └── usage-ext:YYYY-MM-DD  ← Uso diario de modelos externos (tokens)
├── archivos/
│   ├── index:files           ← hash → {nombre, tamaño, tipo, fecha, convIds[]}
│   └── data:<hash>           ← 1 copia por hash (dedup)
└── bookmarks/    
│   └── index.json
```


## 📊 Límites gratuitos

| Recurso | Límite | Reset |
|---------|--------|-------|
| Workers AI | 10.000 Neurons/día | 00:00 UTC |
| R2 | 10 GB + 1M operaciones/mes | Mensual |
| Workers | 100.000 requests/día | Diario |

Mensajes aproximados por día (10.000 Neurons):

| Modelo | Mensajes/día |
|--------|-------------|
| GLM 4.7 Flash | ~4.348 |
| Gemma 4 26B | ~1.563 |
| Llama 3.3 70B | ~229 |
| Nemotron 3 120B | ~314 |

## 🤖 Modelos incluidos

| Modelo | Creador | Año | Orientación |
|--------|---------|-----|-------------|
| GLM 4.7 Flash | Zhipu AI (Z.ai) | 2025 | Chat rápido, uso diario |
| Gemma 4 26B | Google | 2025 | Balance calidad/velocidad |
| Llama 3.3 70B | Meta | 2024-2025 | Razonamiento, código, análisis |
| Nemotron 3 120B | NVIDIA | 2025 | Tareas avanzadas, razonamiento profundo |

Los tipos de archivo que acepta cada modelo se ven en la **Guía de modelos**.

## 🛠️ Despliegue manual (sin botón)

```
git clone https://github.com/jimraynor88/ai-chat-pro.git
cd ai-chat-pro2
npm install
npx wrangler r2 bucket create ia-chat
npx wrangler deploy
npx wrangler secret put AUTH_PASSWORD
npx wrangler secret put AUTH_SECRET
```

### wrangler.toml (estado final)

```
name = "ai-chat-pro"
main = "src/index.js"
compatibility_date = "2026-09-06"

[ai]
binding = "AI"

[[r2_buckets]]
binding = "R2"
bucket_name = "ia-chat"

[vars]
APP_NAME = "AI Chat Pro"
LANG = "es"

[triggers]
crons = ["10 0 * * *"]
```


## ⚙️ Auto-deploy con GitHub Actions

Cada `git push` a la rama `main` despliega el Worker.

Configura una vez en **GitHub → Settings → Secrets and variables → Actions**:

| Nombre | Valor | Dónde |
|--------|-------|-------|
| `CLOUDFLARE_API_TOKEN` | Token con permisos de Workers, R2 y AI | Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Tu Account ID | Dashboard → Overview |

## 🌐 Internacionalización (i18n)

Español e inglés. En `wrangler.toml` cambia `LANG = "es"` por `LANG = "en"` y
despliega. Las traducciones están en `src/i18n.js`.

## 📄 Licencia

CC BY-NC-SA 4.0 (Creative Commons Atribución-NoComercial-CompartirIgual 4.0).

- ✅ Atribución a jimraynor88
- ✅ Sin uso comercial
- ✅ Las modificaciones se comparten bajo la misma licencia

Ver [LICENSE](LICENSE).
