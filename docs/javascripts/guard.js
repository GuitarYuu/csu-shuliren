/**
 * 域名守卫：访客若直接通过原始 *.github.io 地址进入，自动跳回 Worker 正式入口。
 *
 * ★ 部署时替换 OFFICIAL_ENTRY 为你的 Worker 地址（workers.dev 或自定义域名）。
 *
 * ⚠️ 说明：GitHub Pages 无法从服务端彻底禁止直连，此处为客户端跳转级的弱防护；
 *    真正的鉴权（密钥模式）由 Cloudflare Worker 完成，详见 DEPLOY.md 安全章节。
 */
(function () {
  var OFFICIAL_ENTRY = "https://csu-shuliren.<你的子域>.workers.dev"; // ★ 替换

  var h = location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return;   // 本地预览不跳转
  if (h.indexOf(".github.io") === -1) return;           // 经 Worker / 自定义域名访问不处理

  location.replace(OFFICIAL_ENTRY + location.pathname + location.search + location.hash);
})();
