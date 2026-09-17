/**
 * 域名守卫（github.io 侧）：探测 Worker 入口完全可达时才跳转。
 *  - 探测对象改为真实静态资源（extra.css），比 favicon 更能代表整站可用性；
 *  - 探测失败会把时间戳记入 localStorage，12 小时内不再重复尝试（避免反复闪烁跳转）；
 *  - 若 Worker 页面加载后样式缺失（资源被墙断），resilience.js 会自动回退 github.io。
 */
(function () {
  var OFFICIAL_ENTRY = "https://csu-shuliren.2544864177.workers.dev";

  var h = location.hostname;
  if (h === "localhost" || h === "127.0.0.1") return;   // 本地预览不跳转
  if (h.indexOf(".github.io") === -1) return;           // 经 Worker / 自定义域名访问不处理
  if (!OFFICIAL_ENTRY || OFFICIAL_ENTRY.indexOf("<") !== -1) return; // 未配置入口则不跳转

  try {
    var t = parseInt(localStorage.getItem("csu_worker_fail_ts") || "0", 10);
    if (t && Date.now() - t < 12 * 3600 * 1000) return; // 12 小时内 Worker 表现不佳，留在 github.io
  } catch (e) { /* 隐私模式等场景忽略 */ }

  function probe() {
    try {
      return fetch(OFFICIAL_ENTRY + "/assets/stylesheets/extra.css", {
        mode: "no-cors",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
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
      try { localStorage.setItem("csu_worker_fail_ts", String(Date.now())); } catch (e) {}
    });
})();
