/**
 * ============================================================================
 * CSU数理人 · Cloudflare Worker（单文件承载三件事）
 *
 *   1) 站点反向代理：访客只访问本 Worker，原始 GitHub Pages 地址不直接暴露；
 *   2) 访问鉴权：ACCESS_MODE=public 任何人可看；=auth 必须持有效动态密钥
 *      （支持「一次性密钥 / 限时密钥」，存于 KV，可随时撤销）；
 *   3) 访客 API：
 *        POST /api/apply   → 申请访问密钥（存 KV，站长在 CF 后台人工审核）
 *        POST /api/submit  → Markdown 投稿（自动在 GitHub 仓库创建 Issue）
 *
 * KV 数据约定：
 *   token:<key>   访问密钥  {type:"once"|"timed", exp?:毫秒时间戳, note, created}
 *   sess:<sid>    浏览会话  {t?:"限时密钥原文", once?:true, note, ts}（自动过期）
 *   apply:<id>    访问申请  {status:"pending", name, contact, reason, ip, ts}
 *   rl:*          每 IP 每日限流计数（自动过期）
 *
 * Cloudflare 后台配置：
 *   KV 绑定   KV                → 一个 KV 命名空间
 *   变量      ACCESS_MODE       = public | auth
 *             UPSTREAM          = https://<用户名>.github.io/<仓库名>（末尾不带 /）
 *             GITHUB_REPO       = <用户名>/<仓库名>
 *             SESSION_TTL_HOURS = 24（可选，一次性密钥兑换后的会话时长）
 *             SUBMIT_DAILY_LIMIT= 5（可选，每 IP 每日投稿上限）
 *             APPLY_DAILY_LIMIT = 10（可选，每 IP 每日申请上限）
 *   密钥      GITHUB_TOKEN      → Fine-grained PAT，仅该仓库 Issues: Read and write
 * ============================================================================
 */

const COOKIE_NAME = "csu_session";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }

      /* ---------- 访客 API（免鉴权，靠限流 + 字段长度上限防滥用） ---------- */
      if (url.pathname === "/api/apply") return await handleApply(request, env);
      if (url.pathname === "/api/submit") return await handleSubmit(request, env);

      /* ---------- 站点：公开 / 鉴权 两种模式 ---------- */
      if ((env.ACCESS_MODE || "public") === "auth") {
        const key = url.searchParams.get("key");
        if (key) {
          // 携带密钥访问：兑换成功 → 发会话 Cookie 并去掉 key 重定向（密钥不留在地址栏）
          const sid = await redeemKey(env, key);
          if (sid) {
            return new Response(null, {
              status: 302,
              headers: {
                Location: url.pathname,
                "Set-Cookie": `${COOKIE_NAME}=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${sessionTtl(env)}`,
              },
            });
          }
          return denyPage("密钥无效或已过期，请重新输入，或提交访问申请。");
        }
        if (!(await hasValidSession(request, env))) return denyPage();
      }

      return await proxySite(request, env, url);
    } catch (err) {
      return json({ ok: false, error: "服务器内部错误：" + ((err && err.message) || err) }, 500);
    }
  },
};

/* ============================================================================
 * 站点反向代理
 * ========================================================================== */

async function proxySite(request, env, url) {
  const base = (env.UPSTREAM || "").replace(/\/+$/, "");
  if (!base) return new Response("Worker 未配置 UPSTREAM 环境变量", { status: 500 });

  // 不转发 Cookie（会话凭据不外泄给上游），只转发必要的请求头
  const fwd = new Headers();
  for (const h of ["accept", "accept-language", "range", "user-agent"]) {
    const v = request.headers.get(h);
    if (v) fwd.set(h, v);
  }

  const resp = await fetch(base + url.pathname + url.search, {
    method: request.method,
    headers: fwd,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "manual", // 301/302 必须自己改写透传，否则相对资源路径会错位
  });

  if ([301, 302, 303, 307, 308].includes(resp.status)) {
    const abs = new URL(resp.headers.get("Location") || "/", base + url.pathname);
    return new Response(null, {
      status: resp.status,
      headers: { Location: abs.pathname + abs.search + abs.hash },
    });
  }

  const headers = new Headers(resp.headers);
  headers.delete("set-cookie");
  headers.delete("content-encoding"); // fetch 已解压，长度随之变化
  headers.delete("content-length");
  if ((env.ACCESS_MODE || "public") === "auth") {
    // 鉴权模式下禁止 Cloudflare 边缘缓存 HTML，防止已授权内容被缓存后泄露给未授权访客
    const ct = headers.get("Content-Type") || "";
    if (ct.includes("text/html")) headers.set("Cache-Control", "private, no-store");
  }
  return new Response(resp.body, { status: resp.status, headers });
}

/* ============================================================================
 * 密钥与会话
 * ========================================================================== */

function sessionTtl(env) {
  const h = parseInt(env.SESSION_TTL_HOURS || "24", 10);
  return (Number.isFinite(h) && h > 0 ? h : 24) * 3600;
}

/** 当前请求是否携带有效会话 Cookie */
async function hasValidSession(request, env) {
  const m = (request.headers.get("Cookie") || "").match(new RegExp(`${COOKIE_NAME}=([A-Za-z0-9_-]+)`));
  if (!m) return false;
  const raw = await env.KV.get(`sess:${m[1]}`);
  if (!raw) return false;
  let sess;
  try {
    sess = JSON.parse(raw);
  } catch {
    return false;
  }
  if (sess.t) {
    // 限时密钥的会话：密钥一旦被撤销或过期，会话立即失效
    const tok = await env.KV.get(`token:${sess.t}`);
    if (!tok) return false;
    try {
      const t = JSON.parse(tok);
      if (t.type !== "timed" || (t.exp && t.exp < Date.now())) return false;
    } catch {
      return false;
    }
  }
  return true;
}

/** 校验并兑换密钥；一次性密钥兑换后立即从 KV 删除（不可复用） */
async function redeemKey(env, key) {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(key)) return null;
  const raw = await env.KV.get(`token:${key}`);
  if (!raw) return null;
  let tok;
  try {
    tok = JSON.parse(raw);
  } catch {
    return null;
  }
  if (tok.type !== "once" && tok.type !== "timed") return null;
  if (tok.type === "timed" && tok.exp && tok.exp < Date.now()) return null;

  const sid = crypto.randomUUID().replace(/-/g, "");
  const sess =
    tok.type === "once"
      ? { once: true, note: tok.note || "", ts: Date.now() }
      : { t: key, note: tok.note || "", ts: Date.now() };
  await env.KV.put(`sess:${sid}`, JSON.stringify(sess), { expirationTtl: sessionTtl(env) });
  if (tok.type === "once") await env.KV.delete(`token:${key}`);
  return sid;
}

/* ============================================================================
 * POST /api/apply —— 访问申请（存 KV，等站长审核后手动发密钥）
 * ========================================================================== */

async function handleApply(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const limit = parseInt(env.APPLY_DAILY_LIMIT || "10", 10);
  if (!(await rateLimit(env, ip, "apply", Number.isFinite(limit) ? limit : 10))) {
    return json({ ok: false, error: "提交过于频繁，请明天再试。" }, 429);
  }

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: "请求格式错误" }, 400);
  const name = clip(body.name, 40);
  const contact = clip(body.contact, 80);
  const reason = clip(body.reason, 500);
  if (!name || !contact) return json({ ok: false, error: "姓名和联系方式为必填项" }, 400);

  const id = Date.now().toString(36) + "-" + crypto.randomUUID().slice(0, 8);
  await env.KV.put(
    `apply:${id}`,
    JSON.stringify({ status: "pending", name, contact, reason, ip, ts: Date.now() }),
    { expirationTtl: 180 * 86400 } // 180 天后自动清理
  );
  return json({ ok: true, message: "申请已提交，管理员审核通过后会将密钥发到你的联系方式。" });
}

/* ============================================================================
 * POST /api/submit —— Markdown 投稿 → GitHub Issue
 * ========================================================================== */

async function handleSubmit(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const limit = parseInt(env.SUBMIT_DAILY_LIMIT || "5", 10);
  if (!(await rateLimit(env, ip, "submit", Number.isFinite(limit) ? limit : 5))) {
    return json({ ok: false, error: "今日投稿次数已达上限，请明天再试。" }, 429);
  }

  const body = await readJson(request);
  if (!body) return json({ ok: false, error: "请求格式错误" }, 400);
  const title = clip(body.title, 120);
  const author = clip(body.author, 40);
  const email = clip(body.email, 80);
  const content = typeof body.content === "string" ? body.content.slice(0, 50000) : "";
  if (!title || !author || !content) {
    return json({ ok: false, error: "标题、作者、正文为必填项" }, 400);
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "邮箱格式不正确" }, 400);
  }

  // 元信息块（单行字段）放在 Issue 正文最顶部，auto-publish 工作流据此生成文章 front matter；
  // 之后的内容为投稿原文，一字不改。
  const now = new Date().toISOString();
  const line = (s) => String(s).replace(/[\r\n]+/g, " "); // 元信息必须单行
  const issueBody =
    "<!--CSU-META\n" +
    `title: ${line(title)}\n` +
    `author: ${line(author)}\n` +
    `email: ${line(email || "-")}\n` +
    `date: ${now}\n` +
    "CSU-META-->\n\n" +
    content + "\n";

  const r = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "csu-shuliren-worker",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: `[投稿] ${title}`, body: issueBody }),
  });

  if (!r.ok) {
    console.error("GitHub API error", r.status, await r.text());
    return json({ ok: false, error: "投稿暂时失败（GitHub 接口异常），请稍后再试。" }, 502);
  }
  const issue = await r.json();
  return json({ ok: true, issue_url: issue.html_url, message: "投稿成功！已进入人工审核队列。" });
}

/* ============================================================================
 * 鉴权失败页：密钥进入 + 访问申请 双卡片
 * ========================================================================== */

function denyPage(msg) {
  const banner = msg
    ? `<p class="sub" style="color:#dc2626">⚠ ${msg}</p>`
    : "";
  const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>访问验证 · CSU数理人</title>
<style>
*{box-sizing:border-box;margin:0}
body{font-family:system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;min-height:100vh;
display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#eef2ff,#f8fafc 60%);
padding:24px;color:#1e293b}
.wrap{max-width:760px;width:100%}
h1{font-size:22px;margin-bottom:4px}
.sub{color:#64748b;font-size:14px;margin-bottom:20px}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){.cards{grid-template-columns:1fr}}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px}
.card h2{font-size:16px;margin-bottom:12px}
label{display:block;font-size:13px;color:#475569;margin:10px 0 4px}
input,textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:8px 10px;font-size:14px;font-family:inherit}
textarea{min-height:72px;resize:vertical}
button{margin-top:14px;width:100%;border:0;border-radius:8px;padding:10px;font-size:14px;cursor:pointer;background:#4f46e5;color:#fff}
button:hover{background:#4338ca}
.msg{margin-top:10px;font-size:13px;color:#16a34a;min-height:1em}
.msg.err{color:#dc2626}
.hint{margin-top:16px;font-size:12px;color:#94a3b8;text-align:center}
</style></head><body><div class="wrap">
<h1>🔒 CSU数理人 · 访问验证</h1>
<p class="sub">本站为受保护笔记站点：输入访问密钥进入，或提交申请等待管理员发放密钥。</p>
${banner}
<div class="cards">
<div class="card"><h2>🗝️ 我有密钥</h2>
<form onsubmit="return go(event)">
<label>访问密钥</label><input id="key" placeholder="粘贴管理员发放的密钥" required>
<button type="submit">进入站点</button>
</form></div>
<div class="card"><h2>📝 申请访问</h2>
<form onsubmit="return apply(event)">
<label>姓名 / 昵称</label><input id="name" maxlength="40" required>
<label>联系方式（QQ / 邮箱 / 微信）</label><input id="contact" maxlength="80" required>
<label>申请说明</label><textarea id="reason" maxlength="500" placeholder="例如：CSU 数学系 2023 级，想查阅课程笔记"></textarea>
<button type="submit">提交申请</button>
<div class="msg" id="apply-msg"></div>
</form></div>
</div>
<p class="hint">密钥类型：一次性密钥（进入一次）· 限时密钥（有效期内重复进入，可随时撤销）</p>
<script>
function go(e){e.preventDefault();
var k=document.getElementById('key').value.trim();
if(k)location.href=location.pathname+'?key='+encodeURIComponent(k);return false}
function val(id){return document.getElementById(id).value.trim()}
async function apply(e){e.preventDefault();var m=document.getElementById('apply-msg');
try{var r=await fetch('/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({name:val('name'),contact:val('contact'),reason:val('reason')})});
var d=await r.json();
if(d.ok){m.className='msg';m.textContent='✅ '+d.message;e.target.reset()}
else{m.className='msg err';m.textContent='❌ '+(d.error||'提交失败')}}
catch(err){m.className='msg err';m.textContent='❌ 网络错误，请稍后再试'}
return false}
</script></div></body></html>`;
  return new Response(html, {
    status: 401,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/* ============================================================================
 * 工具函数
 * ========================================================================== */

function clip(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CORS },
  });
}

/** 每 IP 每日限流：KV 计数 + 24h 过期 */
async function rateLimit(env, ip, kind, max) {
  const k = `rl:${kind}:${ip}`;
  const cur = parseInt((await env.KV.get(k)) || "0", 10);
  if (cur >= max) return false;
  await env.KV.put(k, String(cur + 1), { expirationTtl: 86400 });
  return true;
}
