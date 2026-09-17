/**
 * 首页投稿表单逻辑：
 *   （资料汇总可附文件）POST {Worker}/api/upload → 拿到文件 id
 *   → POST {Worker}/api/submit → Cloudflare Worker 调 GitHub API 创建 Issue
 *
 * Worker 地址已回填；经 Worker 访问时走同源，从 github.io 直连（公开模式）时跨域调用。
 * 提示文案跟随站点语言切换（localStorage 的 csu_lang，由 i18n.js 写入）。
 */
(function () {
  var WORKER_ORIGIN = "https://csu-shuliren.2544864177.workers.dev";
  var MAX_FILE_SIZE = 20 * 1024 * 1024;
  var ALLOWED_EXTS = [
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "md", "epub", "mobi",
    "zip", "rar", "7z", "png", "jpg", "jpeg", "gif", "webp",
  ];

  var form = document.getElementById("csu-submit-form");
  if (!form) return;

  var base = location.hostname.indexOf(".github.io") !== -1 ? WORKER_ORIGIN : "";
  var lang = localStorage.getItem("csu_lang") === "en" ? "en" : "zh";
  var MSG = {
    zh: {
      busy: "提交中…",
      uploading: "📎 文件上传中…",
      btn: "📮 提交投稿",
      ok: "✅ 投稿成功！已进入人工审核队列。",
      view: "查看审核进度 →",
      fail: "提交失败，请稍后再试",
      neterr: "❌ 网络错误，请稍后再试",
      upbusy: "📎 上传中…",
      toobig: "文件超过 20MB 限制",
      badtype: "不支持的文件格式，请使用 PDF / Word / PPT / 压缩包等常见格式",
      upfail: "附件上传失败，请稍后再试（或去掉附件直接投稿）",
    },
    en: {
      busy: "Submitting…",
      uploading: "📎 Uploading file…",
      btn: "📮 Submit",
      ok: "✅ Submitted! Your post has entered the review queue.",
      view: "Track review progress →",
      fail: "Submission failed, please try again later",
      neterr: "❌ Network error, please try again later",
      upbusy: "📎 Uploading…",
      toobig: "File exceeds the 20MB limit",
      badtype: "Unsupported file type — please use PDF / Word / PPT / archives, etc.",
      upfail: "File upload failed — try again later, or submit without the attachment",
    },
  }[lang];

  // 选择「资料汇总」时显示附件框
  var fileBox = document.getElementById("csu-file-box");
  var fileInput = document.getElementById("csu-f-file");
  var fileHint = document.getElementById("csu-file-hint");
  form.querySelectorAll('input[name="type"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      fileBox.hidden = currentType() !== "资料汇总";
    });
  });
  function currentType() {
    var r = form.querySelector('input[name="type"]:checked');
    return r ? r.value : "经验分享";
  }

  // 选择文件后即时校验并提示
  fileInput.addEventListener("change", function () {
    fileHint.textContent = "";
    fileHint.className = "csu-file-hint";
    if (!fileInput.files || !fileInput.files[0]) return;
    var f = fileInput.files[0];
    var ext = (f.name.split(".").pop() || "").toLowerCase();
    if (ALLOWED_EXTS.indexOf(ext) === -1) {
      fileHint.className = "csu-file-hint err";
      fileHint.textContent = MSG.badtype;
      fileInput.value = "";
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      fileHint.className = "csu-file-hint err";
      fileHint.textContent = MSG.toobig;
      fileInput.value = "";
      return;
    }
    var human = f.size >= 1048576 ? (f.size / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(f.size / 1024)) + " KB";
    fileHint.textContent = "📎 " + f.name + "（" + human + "）";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var btn = document.getElementById("csu-f-btn");
    var box = document.getElementById("csu-submit-result");

    function setBusy(text) {
      btn.disabled = true;
      btn.textContent = text;
      box.hidden = true;
    }
    function finish() {
      btn.disabled = false;
      btn.textContent = MSG.btn;
    }
    function show(ok, html) {
      box.hidden = false;
      box.className = "csu-result " + (ok ? "ok" : "err");
      if (ok) box.innerHTML = html;
      else box.textContent = html;
    }

    // 附件校验
    var file = fileBox.hidden ? null : (fileInput.files && fileInput.files[0] ? fileInput.files[0] : null);
    if (file) {
      var ext = (file.name.split(".").pop() || "").toLowerCase();
      if (ALLOWED_EXTS.indexOf(ext) === -1) return show(false, "❌ " + MSG.badtype);
      if (file.size > MAX_FILE_SIZE) return show(false, "❌ " + MSG.toobig);
    }

    var typeInput = form.querySelector('input[name="type"]:checked');
    var payload = {
      type: typeInput ? typeInput.value : "经验分享",
      title: val("csu-f-title"),
      author: val("csu-f-author"),
      email: val("csu-f-email"),
      tags: val("csu-f-tags"),
      content: document.getElementById("csu-f-content").value,
    };

    var pre = Promise.resolve();
    if (file) {
      setBusy(MSG.uploading);
      var fd = new FormData();
      fd.append("file", file);
      pre = fetch(base + "/api/upload", { method: "POST", body: fd })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.ok) throw new Error(d.error || MSG.upfail);
          payload.fileId = d.id;
          payload.fileName = d.name;
          payload.fileSize = d.size;
        });
    } else {
      setBusy(MSG.busy);
    }

    pre.then(function () {
      btn.textContent = MSG.busy;
      return fetch(base + "/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(function (r) { return r.json(); });
    })
      .then(function (d) {
        if (d.ok) {
          show(true, "✅ " + esc(d.message || MSG.ok) +
            (d.issue_url
              ? ' <a href="' + d.issue_url + '" target="_blank" rel="noopener">' + MSG.view + "</a>"
              : ""));
          form.reset();
          fileHint.textContent = "";
        } else {
          show(false, "❌ " + (d.error || MSG.fail));
        }
      })
      .catch(function (err) {
        show(false, err && err.message && err.message.indexOf("20MB") === -1 && err.message.indexOf("格式") === -1
          ? "❌ " + err.message
          : "❌ " + MSG.neterr);
      })
      .finally(finish);
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
