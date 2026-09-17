# CSU数理人 · 部署与运维手册

整套架构：**MkDocs Material（GitHub Pages）+ Cloudflare Worker（反代 + 鉴权 + 投稿 API）+ Cloudflare KV + GitHub Actions**，全部使用免费额度即可运行。

## 架构总览

```
访客 ──▶ Cloudflare Worker（你的 workers.dev 域名）
          ├─ ACCESS_MODE=public ─▶ 直接反代 ─▶ GitHub Pages（MkDocs 静态站）
          ├─ ACCESS_MODE=auth   ─▶ 校验 KV 密钥/会话 ── 通过 ─▶ 反代
          │                                     └─ 不通过 ─▶ 密钥输入 / 访问申请页
          ├─ POST /api/apply  ─▶ 申请存入 KV ─▶ 你在 CF 后台审核后手动发密钥
          └─ POST /api/submit ─▶ 调 GitHub API 创建「[投稿]」Issue
                     │ 你给 Issue 打 publish 标签
                     ▼
      Action① auto-publish：生成 docs/posts/*.md → 提交 main → 关闭 Issue
                     │ workflow_dispatch 显式触发
                     ▼
      Action② build-site：mkdocs build → 部署 GitHub Pages → 文章上线
```

## 文件清单

```
csu-shuliren/
├── mkdocs.yml                     # MkDocs Material 配置（MathJax、主题）
├── docs/
│   ├── .pages                     # 免维护导航（awesome-pages 插件）
│   ├── index.md                   # 首页（含投稿表单）
│   ├── posts/                     # 审核通过的文章自动落在这里
│   ├── javascripts/
│   │   ├── mathjax.js             # MathJax 3 配置
│   │   ├── protect.js             # 弱防复制（右键/选中/Ctrl+C）
│   │   ├── guard.js               # ★ github.io 直连 → 跳回 Worker 入口
│   │   └── submit.js              # ★ 投稿表单提交逻辑
│   └── stylesheets/extra.css      # 首页与表单样式
├── .github/workflows/
│   ├── auto-publish.yml           # Action①：publish 标签 → 自动发文
│   └── build-site.yml             # Action②：构建并部署 Pages
├── worker/worker.js               # Cloudflare Worker（鉴权+反代+投稿API）
└── scripts/
    ├── build-post.js              # Issue → Markdown 文章（CI 内运行）
    └── gen-token.js               # ★ 本地生成动态访问密钥
```

## ★ 占位符替换清单（部署时必改，共 2 处 + 1 处可选）

| 文件 | 位置 | 替换为 |
|---|---|---|
| `docs/javascripts/guard.js` | `OFFICIAL_ENTRY` | 你的 Worker 地址，如 `https://csu-shuliren.你的子域.workers.dev` |
| `docs/javascripts/submit.js` | `WORKER_ORIGIN` | 同上 |
| `mkdocs.yml` | `site_url`（可选） | 你的 GitHub Pages 地址，用于生成 sitemap |

---

## 步骤 0 · 前置条件

- GitHub 账号、Cloudflare 账号（免费版即可）；
- 本地安装 Node.js ≥ 18（站长运行密钥脚本用）；
- 可选：Python ≥ 3.8（本地预览站点用）。

## 步骤 1 · 创建 GitHub 仓库并推送代码

1. GitHub 新建仓库，取名如 `csu-shuliren`（**Public**——免费版 Pages 与 Actions 需要公开仓库）；
2. 把本项目全部文件推上去：

```bash
cd csu-shuliren
git init && git add . && git commit -m "init: CSU数理人站点"
git branch -M main
git remote add origin https://github.com/<你的用户名>/csu-shuliren.git
git push -u origin main
```

## 步骤 2 · 启用 GitHub Pages

仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
（选好后 build-site.yml 才能部署成功。）

## 步骤 3 · 创建 GitHub Token（最小权限，仅 Worker 用）

1. GitHub → **Settings → Developer settings → Fine-grained personal access tokens → Generate new token**；
2. Repository access：**Only select repositories** → 只勾选你的仓库；
3. Permissions → Repository permissions → **Issues: Read and write**（其余一律保持 No access，Metadata 只读会自动附带）；
4. 过期时间自选，生成后**立即复制**（只显示一次）。

> 该 Token 只有「建/改 Issue」权限，**没有代码读写权限**。即使泄露，攻击者也无法改动网站源码。
> 它只保存在 Cloudflare Worker 的加密 Secret 中，永远不会出现在前端页面里。

## 步骤 4 · 创建 Cloudflare KV 与 Worker

**4.1 创建 KV 命名空间**
Cloudflare 控制台 → **Storage & Databases → KV → Create namespace** → 命名 `csu-shuliren-kv`。

**4.2 创建 Worker**
**Workers & Pages → Create → Worker** → 命名 `csu-shuliren` → Deploy → **Edit code** →
把 `worker/worker.js` 全部内容粘贴覆盖 → **Deploy**。
记下分配的地址：`https://csu-shuliren.<你的子域>.workers.dev`（首次创建时会让你选子域名）。

**4.3 绑定 KV**
Worker → **Settings → Bindings → Add → KV Namespace** → 变量名填 `KV` → 选择 `csu-shuliren-kv`。

**4.4 配置变量与密钥**
Worker → **Settings → Variables and Secrets**：

| 名称 | 类型 | 必填 | 值 / 说明 |
|---|---|---|---|
| `ACCESS_MODE` | Text | ✅ | `public`（公开模式）或 `auth`（密钥模式），随时可改 |
| `UPSTREAM` | Text | ✅ | `https://<你的用户名>.github.io/csu-shuliren`（末尾**不带**斜杠；GitHub 会把用户名转为小写） |
| `GITHUB_REPO` | Text | ✅ | `<你的用户名>/csu-shuliren` |
| `SESSION_TTL_HOURS` | Text | 可选 | 一次性密钥兑换后的会话时长（小时），默认 `24` |
| `SUBMIT_DAILY_LIMIT` | Text | 可选 | 每 IP 每日投稿上限，默认 `5` |
| `APPLY_DAILY_LIMIT` | Text | 可选 | 每 IP 每日申请上限，默认 `10` |
| `GITHUB_TOKEN` | **Secret** | ✅ | 步骤 3 创建的 Fine-grained PAT |

**4.5** 修改后点 **Deploy** 生效。

## 步骤 5 · 回填占位符并推送

用步骤 4.2 得到的 Worker 地址，替换：

1. `docs/javascripts/guard.js` 中的 `OFFICIAL_ENTRY`；
2. `docs/javascripts/submit.js` 中的 `WORKER_ORIGIN`；
3. （可选）`mkdocs.yml` 中的 `site_url`。

```bash
git add . && git commit -m "config: 回填 Worker 地址" && git push
```

推送后 **Build Site** 工作流自动运行，Pages 部署完成即全链路就绪。

## 步骤 6 · 本地预览（可选）

```bash
pip install mkdocs-material mkdocs-awesome-pages-plugin
mkdocs serve    # 打开 http://127.0.0.1:8000（guard.js 对 localhost 自动失效）
```

## 步骤 7 · 全流程验收清单

- [ ] 打开 Worker 地址 → 能看到站点首页（public 模式）；
- [ ] 首页投稿表单提交一篇测试 → 仓库 Issues 出现 `[投稿] …`，正文含元信息块与原文；
- [ ] 给该 Issue 打 `publish` 标签（必须由仓库所有者操作）→ **Auto Publish** 跑完 → main 多出 `docs/posts/*.md` → **Build Site** 自动跑 → Pages 更新、文章出现在侧边栏「笔记文章」下；
- [ ] 直连 `https://<用户名>.github.io/csu-shuliren/` → 自动跳回 Worker 入口；
- [ ] 把 `ACCESS_MODE` 改为 `auth` → 无痕窗口访问 Worker → 出现验证页；
- [ ] `node scripts/gen-token.js timed 7 测试` → 把 Key/Value 粘贴进 KV（或配置 API 直连自动写入）→ 用 `?key=<密钥>` 进入成功；
- [ ] 验证页「申请访问」提交 → KV 中出现 `apply:` 前缀条目。

---

## 日常运维 A · 访问密钥管理（auth 模式）

### 生成与发放

```bash
node scripts/gen-token.js once 张三-试读          # 一次性密钥：首次使用即作废
node scripts/gen-token.js timed 30 李四-九月月度   # 限时密钥：30 天有效，期内可反复进入
```

- 不配置 API 环境变量时：脚本打印 **KV Key / Value**，到 Cloudflare 控制台
  **Storage & Databases → KV → csu-shuliren-kv → Add entry** 手工粘贴即可；
- 配置了 `CF_ACCOUNT_ID`、`KV_NAMESPACE_ID`、`CF_API_TOKEN` 三个环境变量时：脚本直接写入云端；
- 把脚本输出里的 `https://<你的Worker域名>/?key=<密钥>` 链接发给申请人。

### 审核访问申请

Cloudflare 控制台 → KV → `csu-shuliren-kv` → 按前缀 `apply:` 筛选 → 逐条查看
`{name, contact, reason, ip, ts}` → 决定是否发放密钥（用上面的脚本生成）。
条目 180 天自动过期，无需清理；也可手动删除。

### 撤销密钥

- 控制台手动删除 `token:<密钥>` 这一条；或 `node scripts/gen-token.js revoke <密钥>`（需配置 API）。
- **限时密钥撤销立即生效**：其派生的所有会话在下一次请求时即失效；
- 一次性密钥本身兑换后就已删除，无需撤销。

### 模式切换

改 Worker 变量 `ACCESS_MODE` 为 `public` / `auth` 后保存即生效（约几秒）。

## 日常运维 B · 投稿审核

Worker 会把投稿创建为标题带 `[投稿]` 前缀的 Issue，正文首部是 `<!--CSU-META-->` 元信息块（标题/作者/邮箱/时间），其后是投稿 Markdown 原文。

- ✅ **通过**：给 Issue 打 `publish` 标签（必须由仓库所有者本人操作）→ Action 自动生成 `docs/posts/<日期>-issue-<编号>-<标题>.md` → 提交 main → 自动构建部署 → 自动评论并关闭 Issue；
- ❌ **拒绝**：可打 `reject` 标签留档（可选），然后手动关闭 Issue → **不生成任何文件**；
- 防重复：已关闭的 Issue 重新打标签不会触发发布（workflow 内有 `issue.state == 'open'` 校验）。

## 环境变量参考

见步骤 4.4 表格。所有变量都在 Worker → Settings → Variables and Secrets 中维护；
修改文本变量立即生效，无需重新粘贴代码。

## KV 数据结构约定

| 键前缀 | 值（JSON） | 过期 | 用途 |
|---|---|---|---|
| `token:<密钥>` | `{type:"once"\|"timed", exp?, note, created}` | 手动删除 | 访问密钥 |
| `sess:<会话ID>` | `{t?:"限时密钥原文", once?:true, note, ts}` | SESSION_TTL_HOURS | 浏览会话 |
| `apply:<ID>` | `{status, name, contact, reason, ip, ts}` | 180 天 | 访问申请 |
| `rl:submit:<IP>` / `rl:apply:<IP>` | 计数 | 24 小时 | 每日限流 |

---

## 附件、标签与收件箱架构（2026-09 新增）

- **三类栏目**：投稿表单可选 经验分享 / 灵光一现 / 资料汇总，文章自动归档到 `docs/posts/experience|insights|resources/`，页面顶部生成彩色类型徽章与标签 chips；
- **附件上传（资料汇总）**：可选文件（PDF/Word/PPT/压缩包等 ≤20MB）先传至 Worker 暂存 KV；
- **收件箱仓库**：所有投稿 Issue 存放在独立仓库 `csu-submissions`（网站源码主仓库对投稿者不可见）；Worker 变量 `GITHUB_REPO` 与前端 `submit.js` 均指向收件箱；
- **发布 = 标签**：在收件箱 Issue 上打 `publish` 标签后，站点构建时自动拉取已审核投稿生成页面（含附件下载按钮，附件转存进仓库后从 github.io 提供下载）；**移除标签即下线**。构建可在主仓库 Actions 页手动触发；
- **附件全文检索**：PDF / txt / md / docx 附件发布时自动提取全文，以折叠块附在文末，进入站内搜索索引；扫描版 PDF（纯图片）无法提取；
- **KV 附件清理**：附件以 KV 为源、构建时转存，暂不自动删除；可在 CF 控制台 KV 按 `file:*` / `filemeta:*` 前缀手动清理旧文件；
- **新投稿通知**：notify.yml 工作流位于收件箱仓库，支持 QQ 邮箱 / Server酱 / Telegram（对应 Secrets：`MAIL_TO`/`MAIL_USER`/`MAIL_PASS`、`SERVERCHAN_KEY`、`TG_BOT_TOKEN`/`TG_CHAT_ID`，已在收件箱仓库配置 QQ 邮箱）；
- **投稿双通道**：在线通道（Worker）+ GitHub 直投备用通道（`csu-submissions/issues/new` 预填链接，国内可用）；换 Worker 域名时需同步修改 `guard.js`、`submit.js`、主仓库 `auto-publish` 已废弃无需管、以及 **build-site.yml 与收件箱 notify.yml 中硬编码的 `WORKER_URL`**。

---

## 安全边界与重要免责声明

1. **访客权限模型**：GitHub Token 只存于 Worker 加密 Secret，且仅有该仓库 `Issues: Read and write` 权限——访客的任何操作都只能产生 Issue / KV 记录，**无法写入或修改网站源码**；发布动作只由你的 GitHub 账号触发。

2. **publish 标签防护**：workflow 内置双重校验 `label == publish` 且 `actor == repository_owner`；其他协作者即使打标签也不会触发发布（何况默认也没有人有写权限）。

3. **关于 github.io 直连**：GitHub Pages **无法从服务端彻底禁止直连**。本方案做了两层：
   - 客户端守卫 `guard.js`：直连 github.io 的浏览器会被自动跳回 Worker 正式入口；
   - Worker 鉴权层：auth 模式下所有内容必须经 Worker 校验密钥，且 HTML 禁止边缘缓存。
   - 剩余风险：禁用 JS 的访问者仍能看到 github.io 上的静态内容（无鉴权）。**本架构是「访问控制」而非「加密保密」，有强保密需求的内容不要发布到公开 Pages。**

4. **防复制为弱防护**：`protect.js` 实现的禁右键、禁选中、拦截 Ctrl+C **仅仅是弱防护，无法阻止操作系统截图、屏幕录制、手机拍照；访客关闭 JavaScript 即可完全绕过，不能作为高强度保密手段**，仅用于提高随意复制的门槛。

5. **数据合规**：KV 中保存的申请人姓名/联系方式属于个人数据，请仅用于发放密钥用途，及时清理失效条目。

## 常见问题 FAQ

- **workers.dev 在国内访问不稳定？**
  Worker → Settings → **Domains & Routes → Add Custom Domain** 绑定自有域名（域名需托管在 Cloudflare），然后把 `guard.js`、`submit.js` 两处地址同步改为新域名并推送重新部署。
- **MathJax CDN 加载慢？**
  `mkdocs.yml` 中把 `cdn.jsdelivr.net` 换成其他镜像（如 `https://npm.elemecdn.com/mathjax@3/es5/tex-mml-chtml.js`）。
- **打了 publish 标签没反应？**
  确认操作者是仓库所有者、Issue 处于开启状态；到仓库 Actions 页查看运行记录与报错。
- **投稿 Issue 创建失败？**
  检查 Worker 日志（Workers & Pages → csu-shuliren → Logs）：多为 `GITHUB_TOKEN` 过期或权限不足。
- **想临时全站下线？**
  Workers & Pages 中把该 Worker Disable 即可；恢复则 Enable。
- **改了 UPSTREAM / 仓库改名？**
  同步更新 Worker 变量 `UPSTREAM`、`GITHUB_REPO`，以及 `guard.js`、`submit.js` 中的地址。
