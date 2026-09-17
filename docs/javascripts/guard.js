/**
 * 域名守卫：访客若直接通过原始 *.github.io 地址进入，自动跳回 Worker 正式入口。
 *
 * 智能跳转：先探测 Worker 入口是否可达（部分地区网络屏蔽 workers.dev），
 *   - 可达   → 跳转到 Worker 正式入口（鉴权模式在此强制密钥）
 *   - 不可达 → 留在 github.io，保证站点始终可浏览
 */
(function () {
  var OFFICIAL_ENTRY = "https://csu-shuliren.2544864177.workers.dev";

  var h = location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return;   // 本地预览不跳转
  if (h.indexOf(".github.io") === -1) return;           // 经 Worker / 自定义域名访问不处理
  if (!OFFICIAL_ENTRY || OFFICIAL_ENTRY.indexOf("<") !== -1) return; // 未配置入口则不跳转

  function probe() {
    try {
      return fetch(OFFICIAL_ENTRY + "/favicon.ico", {
        mode: "no-cors",
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }
  probe()
    .then(function () {
      location.replace(OFFICIAL_ENTRY + location.pathname + location.search + location.hash);
    })
    .catch(function () {
      /* Worker 入口不可达（如部分地区屏蔽 workers.dev），留在 github.io */
    });
})();
