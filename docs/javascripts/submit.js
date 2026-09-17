/**
 * 首页投稿表单逻辑：
 *   表单 → POST {Worker}/api/submit → Cloudflare Worker 调 GitHub API 创建 Issue
 *
 * ★ 部署时替换 WORKER_ORIGIN 为你的 Worker 地址。
 *   经 Worker 访问时自动走同源（留空即可）；从 github.io 直连（公开模式）时跨域调用 Worker。
 */
(function () {
  var WORKER_ORIGIN = "https://csu-shuliren.<你的子域>.workers.dev"; // ★ 替换

  var form = document.getElementById("csu-submit-form");
  if (!form) return;

  var base = location.hostname.indexOf(".github.io") !== -1 ? WORKER_ORIGIN : "";

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = document.getElementById("csu-f-btn");
    var box = document.getElementById("csu-submit-result");
    var payload = {
      title: val("csu-f-title"),
      author: val("csu-f-author"),
      email: val("csu-f-email"),
      content: document.getElementById("csu-f-content").value,
    };

    btn.disabled = true;
    btn.textContent = "提交中…";
    box.hidden = true;

    fetch(base + "/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        box.hidden = false;
        if (d.ok) {
          box.className = "csu-result ok";
          box.innerHTML =
            "✅ " + esc(d.message) +
            (d.issue_url
              ? ' <a href="' + d.issue_url + '" target="_blank" rel="noopener">查看审核进度 →</a>'
              : "");
          form.reset();
        } else {
          box.className = "csu-result err";
          box.textContent = "❌ " + (d.error || "提交失败，请稍后再试");
        }
      })
      .catch(function () {
        box.hidden = false;
        box.className = "csu-result err";
        box.textContent = "❌ 网络错误，请稍后再试";
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = "📮 提交投稿";
      });
  });

  function val(id) {
    return document.getElementById(id).value.trim();
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
})();
