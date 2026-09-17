/**
 * 韧性回退（Worker 域名侧）：经 Worker 打开站点时，若检测到样式表加载失败
 * （部分网络对 workers.dev 的静态资源断流），自动跳回 github.io 镜像，保证可读。
 *
 * 回退条件（同时满足）：
 *  1) 当前在 *.workers.dev 上（自定义域名视为稳定，不回退）；
 *  2) 页面带有 csu-access=public 标记（公开模式；鉴权模式内容受保护，不回退）；
 *  3) window.load 后 1.2 秒页面仍无任何已加载样式表。
 */
(function () {
  var GITHUB_SITE = "https://guitaryuu.github.io/csu-shuliren";

  var h = location.hostname;
  if (h.indexOf(".github.io") !== -1) return;      // 已在 github.io
  if (h === "localhost" || h === "127.0.0.1") return;
  if (h.indexOf("workers.dev") === -1) return;     // 自定义域名不回退

  var marker = document.querySelector('meta[name="csu-access"]');
  if (!marker || marker.getAttribute("content") !== "public") return; // 鉴权模式不回退

  function cssBroken() {
    try {
      return !document.styleSheets || document.styleSheets.length === 0;
    } catch (e) {
      return true;
    }
  }

  function check() {
    if (!cssBroken()) return; // 样式正常，无需回退
    try { localStorage.setItem("csu_worker_fail_ts", String(Date.now())); } catch (e) {}
    location.replace(GITHUB_SITE + location.pathname + location.search + location.hash);
  }

  if (document.readyState === "complete") setTimeout(check, 1200);
  else window.addEventListener("load", function () { setTimeout(check, 1200); });
})();
