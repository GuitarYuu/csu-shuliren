# RESUME · 项目状态检查点

## 状态：全部配置完成（2026-09-17）。仅剩 GITHUB_TOKEN 到期续期与大陆入口（自定义域名）两项长期事项

## 已完成
- [x] 全套代码：MkDocs Material 站点 / Worker / Actions / 脚本 / 文档
- [x] GitHub 仓库：https://github.com/GuitarYuu/csu-shuliren （Public）
- [x] GitHub Pages：Source=GitHub Actions，构建部署全部跑通
- [x] 站点：https://guitaryuu.github.io/csu-shuliren/ （大陆可直连）
- [x] Cloudflare：KV 命名空间 `csu-shuliren-kv`
- [x] Worker `csu-shuliren`：完整 worker.js 已部署（csu-shuliren.2544864177.workers.dev）
- [x] 绑定：KV → csu-shuliren-kv
- [x] 变量：ACCESS_MODE=public、UPSTREAM、GITHUB_REPO、GITHUB_TOKEN（Secret，已加密）
- [x] 前端占位符已回填（guard.js 带可达性探测：workers.dev 不可达时留在 github.io）

## 长期事项
1. **GITHUB_TOKEN 到期**：PAT 过期后投稿会失败，到 GitHub → Settings → Developer settings 更新后，
   在 Worker → Settings → Variables and Secrets 里更新 GITHUB_TOKEN 的值
2. **大陆访问 Worker 入口**：workers.dev 被墙（DNS 污染 + SNI 阻断，已实测）。
   解决：买一个域名 → 托管到 Cloudflare → Worker → Settings → Domains & Routes → Add Custom Domain
   → 把 guard.js / submit.js 两处地址换成新域名推送即可（其余不用动）
3. 投稿审核流程：Issue 打 `publish` 标签（仅本人）→ 自动发布；拒绝 → 关闭 Issue

## 关键地址
- 站点：https://guitaryuu.github.io/csu-shuliren/
- 仓库：https://github.com/GuitarYuu/csu-shuliren
- Worker：https://csu-shuliren.2544864177.workers.dev （大陆不可直连）
- Worker 设置：Cloudflare 控制台 → Workers & Pages → csu-shuliren → Settings

## 关键命令
```bash
pip install mkdocs-material mkdocs-awesome-pages-plugin && mkdocs serve   # 本地预览
node scripts/gen-token.js once [备注]        # 一次性密钥（auth 模式用）
node scripts/gen-token.js timed 30 [备注]    # 限时密钥
```
