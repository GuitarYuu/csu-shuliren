# RESUME · 项目状态检查点

## 状态：代码全部生成完毕（2026-09-17），等待站长按 DEPLOY.md 部署

## 已完成
- [x] MkDocs Material 站点：mkdocs.yml（MathJax + awesome-pages）、首页 index.md（投稿表单）、示例笔记
- [x] 前端脚本：mathjax.js / protect.js（弱防复制）/ guard.js（github.io 跳转守卫）/ submit.js（投稿表单）
- [x] Cloudflare Worker：worker.js（反代 + public/auth 双模式密钥鉴权 + 一次性/限时密钥 + 访问申请 + 投稿转 Issue + 限流）
- [x] GitHub Actions：auto-publish.yml（publish 标签→发文→提交 main→触发构建）、build-site.yml（mkdocs→Pages）
- [x] scripts/build-post.js（Issue→文章）、scripts/gen-token.js（本地密钥生成/撤销）
- [x] DEPLOY.md 部署运维手册、本文档

## 待站长执行（按 DEPLOY.md 顺序）
1. 推送本目录到 GitHub 新仓库（Public）
2. 仓库 Settings → Pages → Source 选「GitHub Actions」
3. 创建 Fine-grained PAT（仅该仓库 Issues: Read and write）
4. Cloudflare：建 KV 命名空间 → 建 Worker 粘贴 worker.js → 绑 KV（变量名 `KV`）→ 配置变量/Secret
5. ★ 回填占位符：`docs/javascripts/guard.js` 的 OFFICIAL_ENTRY、`docs/javascripts/submit.js` 的 WORKER_ORIGIN（Worker 地址）；`mkdocs.yml` 的 site_url（可选）→ 推送
6. 按 DEPLOY.md 步骤 7 验收清单跑通全流程

## 关键命令
```bash
pip install mkdocs-material mkdocs-awesome-pages-plugin && mkdocs serve   # 本地预览
node scripts/gen-token.js once [备注]        # 一次性密钥
node scripts/gen-token.js timed 30 [备注]    # 限时密钥
node scripts/gen-token.js revoke <密钥>      # 撤销（需 CF_ACCOUNT_ID/KV_NAMESPACE_ID/CF_API_TOKEN）
```

## 未决问题
- 无。占位符需站长部署时填入自己的 Worker 地址。
