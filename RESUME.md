# RESUME · 项目状态检查点

## 状态：全量完成，投稿收发已分离至收件箱仓库 csu-submissions（2026-09-18）。含：三类栏目 + 附件上传（资料汇总）+ 标签 + 中英文切换

## 已完成
- [x] 全套代码：MkDocs Material 站点 / Worker / Actions / 脚本 / 文档
- [x] GitHub 仓库与 Pages：https://guitaryuu.github.io/csu-shuliren/ （大陆可直连）
- [x] Cloudflare：KV、Worker `csu-shuliren`、KV 绑定、全部变量与 GITHUB_TOKEN Secret
- [x] 三类栏目（经验分享/灵光一现/资料汇总）→ posts/experience|insights|resources 自动归档 + 彩色徽章
- [x] 附件上传：资料汇总可选文件（≤20MB，PDF/Word/PPT/压缩包等）→ KV 暂存 → publish 时
      Action 下载转存进仓库（docs/posts/resources/files/），文章生成下载按钮，最终从 github.io 提供下载
- [x] 标签：投稿表单可选（≤5 个），front matter `tags` 数组 + 文章页 chips 展示
- [x] 中英文切换：顶栏 EN/中 按钮，仅翻译布局文案（localStorage 记忆），投稿内容保持原语言
- [x] 弱防复制 / guard.js 可达性探测 / MathJax
- [x] 收件箱架构：投稿 Issue 独立仓库，publish 标签=上线、移除标签=下线（构建时拉取，E2E 已验证）

## 长期事项
1. **GITHUB_TOKEN 到期**：投稿失败时先检查是否过期，到 GitHub 重新生成后在
   Worker → Settings → Variables and Secrets 更新 GITHUB_TOKEN
2. **大陆访问 Worker 入口**：workers.dev 被墙（已实测 DNS 污染 + SNI 阻断）。
   附件上传/密钥入口依赖 Worker 可达。解决：买域名托管到 Cloudflare →
   Worker → Settings → Domains & Routes → Add Custom Domain → 把
   guard.js / submit.js / auto-publish.yml（WORKER_URL）三处地址换成新域名
3. **附件孤儿清理**：未 publish 的附件留在 KV（file:*/filemeta:* 前缀），
   publish 后 KV 副本也不自动删（保守设计，便于 Action 失败重试）；
   偶尔去 CF 控制台 KV 手动清理即可
4. auto-publish.yml 里硬编码了 WORKER_URL（附件下载用），换域名时同步修改

## 关键地址
- 站点：https://guitaryuu.github.io/csu-shuliren/
- 仓库：https://github.com/GuitarYuu/csu-shuliren
- Worker：https://csu-shuliren.2544864177.workers.dev （大陆不可直连；版本 de8cd76e）

## 关键命令
```bash
pip install mkdocs-material mkdocs-awesome-pages-plugin && mkdocs serve   # 本地预览
node scripts/gen-token.js once [备注]        # 一次性密钥（auth 模式用）
node scripts/gen-token.js timed 30 [备注]    # 限时密钥
```

## 环境注意事项
- 本机 git 全局配置了 gh-proxy.com 镜像重写（不支持认证推送）：推送前临时
  `git config --global --unset-all url.https://gh-proxy.com/https://github.com/.insteadof`，
  推完恢复。LF/CRLF 警告无害。
