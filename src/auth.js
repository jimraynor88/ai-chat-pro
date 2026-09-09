// Autenticación por contraseña + HTML de login

export async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function makeCookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const c of cookies.split(";")) {
    const [k, ...v] = c.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

export async function checkAuth(request, env) {
  if (!env.AUTH_PASSWORD) return true;
  const token = getCookie(request, "auth_token");
  if (!token) return false;
  const expected = await sha256(env.AUTH_PASSWORD + (env.AUTH_SECRET || "fallback-secret"));
  return token === expected;
}

export function getLoginHTML(t) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t.login_title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:#0b0d10;color:#e4e7eb;display:flex;align-items:center;justify-content:center;min-height:100vh}
.login-box{background:#15181d;border:1px solid #2a2e36;border-radius:16px;padding:32px;max-width:380px;width:90%}
.login-box h1{font-size:20px;margin-bottom:8px;text-align:center}
.login-box p{font-size:13px;color:#8b94a3;text-align:center;margin-bottom:24px}
.login-box input{width:100%;background:#0b0d10;color:#e4e7eb;border:1px solid #2a2e36;border-radius:10px;padding:14px 16px;font-size:16px;margin-bottom:12px}
.login-box input:focus{border-color:#f6821f;outline:none}
.login-box button{width:100%;background:#f6821f;color:#fff;border:none;border-radius:10px;padding:14px;font-size:15px;font-weight:600;cursor:pointer}
.login-box button:hover{opacity:.85}
.error{color:#f87171;font-size:13px;text-align:center;margin-bottom:12px;display:none}
</style>
</head>
<body>
<div class="login-box">
  <h1>🔐 ${t.app_name}</h1>
  <p>${t.login_subtitle}</p>
  <div class="error" id="err">${t.login_error}</div>
  <form id="login-form">
    <input type="password" id="password" placeholder="${t.login_placeholder}" autofocus>
    <button type="submit">${t.login_button}</button>
  </form>
</div>
<script>
document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  var pw = document.getElementById("password").value;
  var res = await fetch("/api/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({password:pw}) });
  if (res.ok) { window.location.href = "/"; }
  else { document.getElementById("err").style.display = "block"; document.getElementById("password").value = ""; document.getElementById("password").focus(); }
});
</script>
</body>
</html>`;
}
