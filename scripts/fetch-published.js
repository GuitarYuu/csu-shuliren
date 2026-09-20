#!/usr/bin/env node
/**
 * 构建时从「收件箱仓库」拉取已审核（publish 标签）的投稿，生成站内文章页。
 * 在 build-site.yml 中、mkdocs build 之前运行。
 *
 * 声明式发布：收件箱 Issue 的 publish 标签 = 上线；移除标签 = 下线。
 * 每次构建先清空生成的投稿页，再按当前标签状态重新生成，因此标签增删即时生效。
 *
 * 环境变量：
 *   GITHUB_TOKEN  Actions 自带 token（读收件箱公开 Issue）
 *   INBOX_REPO    收件箱仓库，默认 GuitarYuu/csu-submissions
 *   WORKER_URL    附件下载地址（下载后随站点从 github.io 提供）
 */
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const INBOX = process.env.INBOX_REPO || "GuitarYuu/csu-submissions";
const TOKEN = process.env.GITHUB_TOKEN || "";
const WORKER = (process.env.WORKER_URL || "").replace(/\/+$/, "");
const ROOT = path.join("docs", "posts");
const DIRS = { "经验分享": "experience", "灵光一现": "insights", "资料汇总": "resources" };
const TONES = { "经验分享": "violet", "灵光一现": "amber", "资料汇总": "blue" };
const MAX_TEXT = 50000;

const escHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const yq = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const humanSize = (n) =>
  n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";

function gh(p) {
  return fetch("https://api.github.com" + p, {
    headers: {
      "User-Agent": "csu-site",
      Accept: "application/vnd.github+json",
      ...(TOKEN ? { Authorization: `token ${TOKEN}` } : {}),
    },
  }).then(async (r) => {
    if (!r.ok) throw new Error(`GitHub API ${r.status}: ${p}`);
    return r.json();
  });
}

async function publishedIssues() {
  const out = [];
  for (let page = 1; ; page++) {
    const arr = await gh(`/repos/${INBOX}/issues?labels=publish&state=all&per_page=100&page=${page}`);
    out.push(...arr);
    if (arr.length < 100) break;
  }
  return out.filter((i) => !i.pull_request);
}

function parseMeta(body) {
  const meta = {};
  const m = body.match(/<!--CSU-META\r?\n([\s\S]*?)CSU-META-->/);
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  const content = (m ? body.slice(m.index + m[0].length) : body).replace(/^\s+/, "");
  return { meta, content };
}

// 清理上一次构建生成的投稿页与附件（保留手写内容与 index 落地页）
function cleanGenerated() {
  for (const dir of Object.values(DIRS)) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) {
      if (f.endsWith(".md") && /-issue-\d+-/.test(f)) fs.unlinkSync(path.join(abs, f));
    }
    const filesDir = path.join(abs, "files");
    if (fs.existsSync(filesDir)) fs.rmSync(filesDir, { recursive: true, force: true });
  }
}

function downloadAttachment(meta, dirAbs) {
  if (!meta.file || !WORKER) return null;
  const safeName = String(meta.filename || meta.file + ".bin")
    .replace(/[\\/:*?"<>|#&[\]{}]+/g, "-")
    .slice(0, 80);
  const dest = path.join(dirAbs, "files", `${meta.file}-${safeName}`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    execSync(`curl -fsSL --max-time 180 "${WORKER}/files/${meta.file}" -o "${dest}"`, { stdio: "pipe" });
    return dest;
  } catch (e) {
    console.warn(`⚠ 附件下载失败（file:${meta.file}），文章将不包含下载链接`);
    try { fs.unlinkSync(dest); } catch {}
    return null;
  }
}

function extractText(dest) {
  let text = "";
  try {
    if (/\.pdf$/i.test(dest)) {
      execSync(`pdftotext -enc UTF-8 "${dest}" /tmp/csu_ft.txt`, { stdio: "pipe" });
      text = fs.readFileSync("/tmp/csu_ft.txt", "utf8");
    } else if (/\.(txt|md)$/i.test(dest)) {
      text = fs.readFileSync(dest, "utf8");
    } else if (/\.docx$/i.test(dest)) {
      execSync(`unzip -p "${dest}" word/document.xml | sed -e 's/<[^>]*>/ /g' > /tmp/csu_ft.txt`, {
        shell: "/bin/bash", stdio: "pipe",
      });
      text = fs.readFileSync("/tmp/csu_ft.txt", "utf8");
    }
  } catch (e) {
    console.warn("附件全文提取失败：", e.message);
    return "";
  }
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
}

(async () => {
  cleanGenerated();
  const issues = await publishedIssues();
  console.log(`收件箱中带 publish 标签的投稿：${issues.length} 篇`);

  for (const issue of issues) {
    const { meta, content } = parseMeta(issue.body || "");
    const type = DIRS[meta.type] ? meta.type : "经验分享";
    const title = meta.title || (issue.title || "").replace(/^(\[投稿\])(\[[^\]]*\])?\s*/, "") || `投稿 #${issue.number}`;
    const author = meta.author || (issue.user ? issue.user.login : "anonymous");
    const date = (meta.date || issue.created_at || new Date().toISOString()).slice(0, 10);
    const tags = String(meta.tags || "").split(/[,，、;；]/).map((t) => t.trim()).filter(Boolean).slice(0, 5);

    const slug =
      title
        .replace(/[\\/:*?"<>|#&[\]{}]+/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w\u4e00-\u9fa5-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "untitled";
    const dirAbs = path.join(ROOT, DIRS[type]);
    fs.mkdirSync(dirAbs, { recursive: true });
    const file = path.join(dirAbs, `${date}-issue-${issue.number}-${slug}.md`);

    // 附件
    const attachDest = downloadAttachment(meta, dirAbs);
    let attach = "";
    if (attachDest) {
      const label = meta.filename || path.basename(attachDest);
      attach =
        `\n<p class="csu-download">` +
        `<a class="csu-dl-btn" href="${path.basename(attachDest)}" download>📎 下载附件：${escHtml(label)}（${humanSize(fs.statSync(attachDest).size)}）</a>` +
        `</p>\n`;
    }

    // 附件全文（进搜索索引 + 在线阅读）
    let fulltextBlock = "";
    if (attachDest) {
      const text = extractText(attachDest);
      if (text) {
        fulltextBlock =
          `\n<details class="csu-fulltext"><summary>📄 附件全文文本（${escHtml(meta.filename || "附件")}）</summary>\n\n` +
          `<pre class="csu-fulltext-pre">${escHtml(text)}</pre>\n</details>\n`;
      }
    }

    const head =
      `<p class="csu-post-type"><span class="csu-badge tone-${TONES[type]}">${escHtml(type)}</span>` +
      `<span class="csu-post-date">${escHtml(date)}</span></p>\n` +
      (tags.length
        ? `<p class="csu-tags">` + tags.map((t) => `<span class="csu-tag"># ${escHtml(t)}</span>`).join("") + `</p>\n`
        : "");

    // 7) 评论区：giscus（GitHub Discussions）—— 不离开文章页直接评论与点赞
    const giscusBlock =
      `\n<h2 id="comments">💬 评论与点赞</h2>\n` +
      `<p class="csu-comments-hint">基于 GitHub Discussions：登录 GitHub 后即可在下方直接评论，第一个 👍 表情就是点赞。</p>\n` +
      `<div class="csu-giscus">\n` +
      `<script src="https://giscus.app/client.js"\n` +
      `  data-repo="${INBOX}"\n` +
      `  data-repo-id="R_kgDOUep9cQ"\n` +
      `  data-category="Announcements"\n` +
      `  data-category-id="DIC_kwDOUep9cc4DF-qQ"\n` +
      `  data-mapping="pathname"\n` +
      `  data-strict="1"\n` +
      `  data-reactions-enabled="1"\n` +
      `  data-emit-metadata="0"\n` +
      `  data-input-position="top"\n` +
      `  data-theme="preferred_color_scheme"\n` +
      `  data-lang="zh-CN"\n` +
      `  data-loading="lazy"\n` +
      `  crossorigin="anonymous"\n` +
      `  async>\n` +
      `</script>\n</div>\n`;

    const fm = [
      "---",
      `title: ${yq(title)}`,
      `author: ${yq(author)}`,
      `date: ${yq(date)}`,
      `type: ${yq(type)}`,
      ...(tags.length ? [`tags: [${tags.map(yq).join(", ")}]`] : []),
      "---",
      "",
      "",
    ].join("\n");

    fs.writeFileSync(file, fm + head + attach + content + "\n" + fulltextBlock + giscusBlock);
    console.log(`✓ ${file}（标签：${tags.join("/") || "无"}，附件：${attachDest ? "有" : "无"}，评论区：giscus）`);
  }
  console.log("完成。");
})().catch((e) => {
  console.error("拉取投稿失败：", e.message);
  process.exit(1);
});
