#!/usr/bin/env node
/**
 * CSU数理人 · 访问密钥生成器（站长本地运行，Node 18+）
 *
 * 用法：
 *   node scripts/gen-token.js once [备注]            生成「一次性密钥」
 *   node scripts/gen-token.js timed <天数> [备注]    生成「限时密钥」
 *   node scripts/gen-token.js revoke <密钥>          撤销密钥（需配置 API 直连）
 *
 * 默认行为：打印 KV 键值对 → 打开 Cloudflare 控制台
 *   （Storage & Databases → KV → csu-shuliren-kv → Add entry）手工粘贴。
 *
 * 可选：设置下面三个环境变量后，脚本直接读写云端 KV，免去手工粘贴：
 *   CF_ACCOUNT_ID      Cloudflare 账户 ID（域名概述页右下角）
 *   KV_NAMESPACE_ID    KV 命名空间 ID
 *   CF_API_TOKEN       API Token（权限：Account → Workers KV Storage → Edit）
 */
"use strict";
const crypto = require("crypto");

const [, , cmd, arg1, ...noteParts] = process.argv;
const ACCT = process.env.CF_ACCOUNT_ID;
const NS = process.env.KV_NAMESPACE_ID;
const TOKEN = process.env.CF_API_TOKEN;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCT}/storage/kv/namespaces/${NS}/values`;

function die(msg) {
  console.error("❌ " + msg);
  process.exit(1);
}
function apiReady() {
  return Boolean(ACCT && NS && TOKEN);
}

async function kvWrite(key, value) {
  const r = await fetch(`${BASE}/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN}` },
    body: value,
  });
  const d = await r.json();
  if (!d.success) die("Cloudflare API 写入失败：" + JSON.stringify(d.errors));
}
async function kvDelete(key) {
  const r = await fetch(`${BASE}/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const d = await r.json();
  if (!d.success) die("Cloudflare API 删除失败：" + JSON.stringify(d.errors));
}
function print(key, value) {
  console.log("\n── 复制到 Cloudflare KV 控制台 ─────────────────");
  console.log("Key   : " + key);
  console.log("Value : " + value);
  console.log("───────────────────────────────────────────────");
}

(async () => {
  if (cmd === "once") {
    const key = "token:" + crypto.randomBytes(16).toString("base64url");
    const value = JSON.stringify({
      type: "once",
      note: noteParts.join(" "),
      created: new Date().toISOString(),
    });
    console.log("✅ 已生成【一次性密钥】（首次使用后立即作废；兑换后获得数小时会话，");
    console.log("   时长由 Worker 变量 SESSION_TTL_HOURS 决定，默认 24 小时）");
    print(key, value);
    if (apiReady()) {
      await kvWrite(key, value);
      console.log("☁️  已通过 API 直接写入 Cloudflare KV。");
    }
    console.log("\n🔑 发给访客的链接：https://<你的Worker域名>/?key=" + key.slice(6));
  } else if (cmd === "timed") {
    const days = parseInt(arg1, 10);
    if (!days || days <= 0) die("用法：node scripts/gen-token.js timed <天数> [备注]");
    const key = "token:" + crypto.randomBytes(16).toString("base64url");
    const value = JSON.stringify({
      type: "timed",
      exp: Date.now() + days * 86400000,
      note: noteParts.join(" "),
      created: new Date().toISOString(),
    });
    console.log(`✅ 已生成【限时密钥】（有效期 ${days} 天，期内可重复使用，可随时撤销）`);
    print(key, value);
    if (apiReady()) {
      await kvWrite(key, value);
      console.log("☁️  已通过 API 直接写入 Cloudflare KV。");
    }
    console.log("\n🔑 发给访客的链接：https://<你的Worker域名>/?key=" + key.slice(6));
  } else if (cmd === "revoke") {
    if (!arg1) die("用法：node scripts/gen-token.js revoke <密钥>");
    if (!apiReady()) {
      die("撤销需要环境变量 CF_ACCOUNT_ID / KV_NAMESPACE_ID / CF_API_TOKEN；\n" +
          "   也可以到 Cloudflare 控制台 KV 中手动删除 token:<密钥> 这一条。");
    }
    await kvDelete("token:" + arg1);
    console.log("🗑️  已撤销密钥：token:" + arg1);
    console.log("   （该密钥新访客无法再进入；已发的限时会话也会立即失效）");
  } else {
    die(
      "用法：\n" +
      "  node scripts/gen-token.js once [备注]           一次性密钥\n" +
      "  node scripts/gen-token.js timed <天数> [备注]   限时密钥\n" +
      "  node scripts/gen-token.js revoke <密钥>         撤销密钥"
    );
  }
})().catch((e) => die(e.message));
