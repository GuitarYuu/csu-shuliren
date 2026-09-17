#!/usr/bin/env node
/**
 * 由投稿 Issue 生成 docs/posts 文章文件（在 auto-publish.yml 中调用）
 *
 * 输入（环境变量，由 GitHub Actions 注入）：
 *   ISSUE_BODY    Issue 正文（Worker 写入的 <!--CSU-META--> 块 + 投稿原文）
 *   ISSUE_TITLE   Issue 标题（形如「[投稿] xxx」）
 *   ISSUE_NUMBER  Issue 编号（用于保证文件名唯一）
 *   ISSUE_AUTHOR  投稿者 GitHub 用户名（元信息缺失时的兜底作者名）
 *
 * 输出：docs/posts/<栏目目录>/<日期>-issue-<编号>-<标题slug>.md
 *   栏目目录：经验分享 → experience / 灵光一现 → insights / 资料汇总 → resources
 */
"use strict";
const fs = require("fs");
const path = require("path");

const body = process.env.ISSUE_BODY || "";
const issueNumber = process.env.ISSUE_NUMBER || "0";
const issueTitle = (process.env.ISSUE_TITLE || "").replace(/^\[投稿\]\s*/, "");
const issueUser = process.env.ISSUE_AUTHOR || "anonymous";

// 栏目白名单与映射
const TYPE_DIRS = { "经验分享": "experience", "灵光一现": "insights", "资料汇总": "resources" };
const TYPE_TONES = { "经验分享": "violet", "灵光一现": "amber", "资料汇总": "blue" };

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

// 2) 栏目类型：不在白名单内一律回落到「经验分享」
const type = TYPE_DIRS[meta.type] ? meta.type : "经验分享";

// 3) 组装 front matter（YAML 双引号转义，防止标题里的引号/反斜杠破坏格式）
const esc = (s) => `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
const title = meta.title || issueTitle || `投稿 #${issueNumber}`;
const author = meta.author || issueUser;
const date = (meta.date || new Date().toISOString()).slice(0, 10);

// 4) 文件名：日期 + Issue 编号 + 清洗后的标题 slug（编号保证唯一，清洗防路径穿越）
const slug =
  title
    .replace(/[\\/:*?"<>|#&[\]{}]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "untitled";
const file = path.join("docs", "posts", TYPE_DIRS[type], `${date}-issue-${issueNumber}-${slug}.md`);

// 5) 文章头部：类型徽章 + 日期（CSS 见 docs/stylesheets/extra.css 的 csu-badge）
const badge =
  `<p class="csu-post-type"><span class="csu-badge tone-${TYPE_TONES[type]}">${type}</span>` +
  `<span class="csu-post-date">${date}</span></p>\n`;

const fm = [
  "---",
  `title: ${esc(title)}`,
  `author: ${esc(author)}`,
  `date: ${esc(date)}`,
  `type: ${esc(type)}`,
  "---",
  "",
  "",
].join("\n");
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, fm + badge + content + "\n");
console.log("生成文章：", file, "（栏目：" + type + "）");
