# RESUME · 项目状态检查点

## 状态：GitHub 侧已全部上线（2026-09-17），剩余 Cloudflare Worker 配置需站长手动完成

## 已完成
- [x] 全套代码：MkDocs 站点 / Worker / Actions / 脚本 / 文档（语法与投稿解析均已实测）
- [x] 仓库已创建：https://github.com/GuitarYuu/csu-shuliren （Public）
- [x] 代码已推送 main（含 mkdocs.yml 的 site_url 已回填）
- [x] Pages 已启用（Source: GitHub Actions），首次构建成功
- [x] 站点已上线：https://guitaryuu.github.io/csu-shuliren/ （HTTP 200 已验证）
- [x] 仓库描述与主页链接已设置

## 待站长执行（Cloudflare 侧，约 10 分钟，详见 DEPLOY.md 步骤 3–5）
1. 创建 Fine-grained PAT（仅本仓库 Issues: Read and write）
2. Cloudflare 建 KV 命名空间 `csu-shuliren-kv`
3. 创建 Worker `csu-shuliren`，粘贴 `worker/worker.js`，绑定 KV（变量名 `KV`），
   配置变量：`ACCESS_MODE=public`（或 `auth`）、`UPSTREAM=https://guitaryuu.github.io/csu-shuliren`、
   `GITHUB_REPO=GuitarYuu/csu-shuliren`；Secret：`GITHUB_TOKEN`
4. ★ 拿到 Worker 地址后回填两处占位符并推送（会自动重新构建站点）：
   - `docs/javascripts/guard.js` → `OFFICIAL_ENTRY`
   - `docs/javascripts/submit.js` → `WORKER_ORIGIN`
5. 按 DEPLOY.md 步骤 7 验收清单跑通投稿→发布全流程

## 关键命令
```bash
pip install mkdocs-material mkdocs-awesome-pages-plugin && mkdocs serve   # 本地预览
node scripts/gen-token.js once [备注]        # 一次性密钥
node scripts/gen-token.js timed 30 [备注]    # 限时密钥
node scripts/gen-token.js revoke <密钥>      # 撤销（需 CF_ACCOUNT_ID/KV_NAMESPACE_ID/CF_API_TOKEN）
```

## 已知环境注意事项
- 本机全局 git 配置了 gh-proxy.com 镜像重写（不支持认证推送）；推送时需临时
  `git config --global --unset-all url.https://gh-proxy.com/https://github.com/.insteadof`，
  推完恢复。Windows 下 LF/CRLF 警告无害（仓库内已归一化为 LF）。
