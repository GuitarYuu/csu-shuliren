/**
 * 首页投稿表单逻辑：
 *   表单 → POST {Worker}/api/submit → Cloudflare Worker 调 GitHub API 创建 Issue
 *
 * Worker 地址已回填；经 Worker 访问时走同源，从 github.io 直连（公开模式）时跨域调用。
 * 提示文案跟随站点语言切换（localStorage 的 csu_lang，由 i18n.js 写入）。
 */
(function () {
  var WORKER_ORIGIN = "https://csu-shuliren.2544864177.workers.dev";

  var form = document.getElementById("csu-submit-form");
  if (!form) return;

  var base = location.hostname.indexOf(".github.io") !== -1 ? WORKER_ORIGIN : "";
  var lang = localStorage.getItem("csu_lang") === "en" ? "en" : "zh";
  var MSG = {
    zh: {
      busy: "提交中…",
      btn: "📮 提交投稿",
      ok: "✅ 投稿成功！已进入人工审核队列。",
      view: "查看审核进度 →",
      fail: "提交失败，请稍后再试",
      neterr: "❌ 网络错误，请稍后再试",
    },
    en: {
      busy: "Submitting…",
      btn: "📮 Submit",
      ok: "✅ Submitted! Your post has entered the review queue.",
      view: "Track review progress →",
      fail: "Submission failed, please try again later",
      neterr: "❌ Network error, please try again later",
    },
  }[lang];

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = document.getElementById("csu-f-btn");
    var box = document.getElementById("csu-submit-result");
    var typeInput = form.querySelector('input[name="type"]:checked');
    var payload = {
      type: typeInput ? typeInput.value : "经验分享",
      title: val("csu-f-title"),
      author: val("csu-f-author"),
      email: val("csu-f-email"),
      content: document.getElementById("csu-f-content").value,
    };

    btn.disabled = true;
    btn.textContent = MSG.busy;
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
            "✅ " + esc(d.message || MSG.ok) +
            (d.issue_url
              ? ' <a href="' + d.issue_url + '" target="_blank" rel="noopener">' + MSG.view + "</a>"
              : "");
          form.reset();
        } else {
          box.className = "csu-result err";
          box.textContent = "❌ " + (d.error || MSG.fail);
        }
      })
      .catch(function () {
        box.hidden = false;
        box.className = "csu-result err";
        box.textContent = MSG.neterr;
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = MSG.btn;
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
