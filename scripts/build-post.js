#!/usr/bin/env node
/**
 * 由投稿 Issue 生成 docs/posts 文章文件（在 auto-publish.yml 中调用）
 *
 * 输入（环境变量，由 GitHub Actions 注入）：
 *   ISSUE_BODY    Issue 正文（Worker 写入的 <!--CSU-META--> 块 + 投稿原文）
 *   ISSUE_TITLE   Issue 标题（形如「[投稿][类型] xxx」）
 *   ISSUE_NUMBER  Issue 编号（用于保证文件名唯一）
 *   ISSUE_AUTHOR  投稿者 GitHub 用户名
 *   FILE_PATH     （可选）auto-publish 已下载的附件路径；有值时文章生成下载按钮
 *
 * 输出：docs/posts/<栏目目录>/<日期>-issue-<编号>-<标题slug>.md
 *   栏目目录：经验分享 → experience / 灵光一现 → insights / 资料汇总 → resources
 */
"use strict";
const fs = require("fs");
const path = require("path");

const body = process.env.ISSUE_BODY || "";
const issueNumber = process.env.ISSUE_NUMBER || "0";
const issueTitle = (process.env.ISSUE_TITLE || "").replace(/^(\[投稿\])(\[[^\]]*\])?\s*/, "");
const issueUser = process.env.ISSUE_AUTHOR || "anonymous";

const TYPE_DIRS = { "经验分享": "experience", "灵光一现": "insights", "资料汇总": "resources" };
const TYPE_TONES = { "经验分享": "violet", "灵光一现": "amber", "资料汇总": "blue" };

// HTML 转义（正文内的布局元素用）
const escHtml = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// 1) 解析 Worker 写入的元信息块：取第一块，其后的全部内容视为投稿正文（一字不改）
const m = body.match(/<!--CSU-META\r?\n([\s\S]*?)CSU-META-->/);
const meta = {};
if (m) {
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
}
const content = (m ? body.slice(m.index + m[0].length) : body).replace(/^\s+/, "");

// 2) 栏目类型与标签
const type = TYPE_DIRS[meta.type] ? meta.type : "经验分享";
const tags = String(meta.tags || "")
  .split(/[,，、;；]/)
  .map((t) => t.trim())
  .filter(Boolean)
  .slice(0, 5);

// 3) front matter（YAML 双引号转义）
const yq = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const title = meta.title || issueTitle || `投稿 #${issueNumber}`;
const author = meta.author || issueUser;
const date = (meta.date || new Date().toISOString()).slice(0, 10);

// 4) 文件名：日期 + Issue 编号 + 清洗后的标题 slug
const slug =
  title
    .replace(/[\\/:*?"<>|#&[\]{}]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "untitled";
const file = path.join("docs", "posts", TYPE_DIRS[type], `${date}-issue-${issueNumber}-${slug}.md`);

// 5) 头部：类型徽章 + 标签 chips
let head =
  `<p class="csu-post-type"><span class="csu-badge tone-${TYPE_TONES[type]}">${escHtml(type)}</span>` +
  `<span class="csu-post-date">${escHtml(date)}</span></p>\n`;
if (tags.length) {
  head +=
    `<p class="csu-tags">` +
    tags.map((t) => `<span class="csu-tag"># ${escHtml(t)}</span>`).join("") +
    `</p>\n`;
}

// 6) 附件下载按钮（auto-publish 下载好 FILE_PATH 时）
let attach = "";
const filePath = process.env.FILE_PATH || "";
if (filePath && fs.existsSync(filePath)) {
  const base = path.basename(filePath);
  const size = fs.statSync(filePath).size;
  const human = size >= 1048576 ? (size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(size / 1024)) + " KB";
  const label = meta.filename || base;
  attach =
    `\n<p class="csu-download">` +
    `<a class="csu-dl-btn" href="${base}" download>📎 下载附件：${escHtml(label)}（${human}）</a>` +
    `</p>\n`;
} else if (meta.file && process.env.WORKER_URL) {
  // 附件未被下载（如下载失败），退化为指向 Worker 的直链
  attach =
    `\n<p class="csu-download">` +
    `<a class="csu-dl-btn" href="${process.env.WORKER_URL.replace(/\/+$/, "")}/files/${escHtml(meta.file)}" download>📎 下载附件：${escHtml(meta.filename || meta.file)}</a>` +
    `</p>\n`;
}

// 7) 附件全文文本（发布时从 PDF/txt/md/docx 提取，供站内搜索索引与在线阅读）
let fulltext = "";
const textPath = process.env.TEXT_PATH || "";
if (textPath && fs.existsSync(textPath)) {
  fulltext = fs.readFileSync(textPath, "utf8").slice(0, 50000).trim();
}
let fulltextBlock = "";
if (fulltext) {
  fulltextBlock =
    `\n<details class="csu-fulltext"><summary>📄 附件全文文本（${escHtml(meta.filename || "附件")}）</summary>\n\n` +
    `<pre class="csu-fulltext-pre">${escHtml(fulltext)}</pre>\n</details>\n`;
}

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
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, fm + head + attach + content + "\n" + fulltextBlock);
console.log(
  "生成文章：", file,
  "（栏目：" + type + "，标签：" + (tags.join("/") || "无") + "，附件：" + (filePath ? "有" : "无") +
  "，全文索引：" + (fulltext ? Math.min(50000, fulltext.length) + " 字符" : "无") + "）"
);
