/**
 * 首页投稿表单逻辑（双通道）：
 *   通道 A（在线）：POST {Worker}/api/submit → Worker 调 GitHub API 创建 Issue
 *   通道 B（备用）：在线通道不可达时（部分网络屏蔽 workers.dev），
 *                   生成预填好的 GitHub Issue 页面链接，访客登录 GitHub 后一键提交
 *
 * 两通道最终都产生审核 Issue → 站长打 publish 标签自动发布。
 * 附件上传（资料汇总）仅通道 A 支持；提示文案跟随站点语言（csu_lang）。
 */
(function () {
  var WORKER_ORIGIN = "https://csu-shuliren.2544864177.workers.dev";
  var ISSUE_NEW_URL = "https://github.com/GuitarYuu/csu-shuliren/issues/new";
  var MAX_FILE_SIZE = 20 * 1024 * 1024;
  var MAX_URL_LEN = 7500;
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
      neterr: "❌ 网络错误：当前网络无法访问投稿服务",
      toobig: "文件超过 20MB 限制",
      badtype: "不支持的文件格式，请使用 PDF / Word / PPT / 压缩包等常见格式",
      upfail: "附件上传失败：",
      fallbackTitle: "⚠ 在线通道当前不可用（你的网络可能屏蔽了投稿服务）",
      fallbackHint: "备选方案：通过 GitHub 提交（需 GitHub 账号登录，暂不支持附件，邮箱不会随投稿公开）。",
      fallbackBtn: "🚀 通过 GitHub 提交 →",
      fallbackOpen: "打开 GitHub 投稿页",
      fallbackCopy: "📋 复制投稿内容",
      fallbackLong: "正文过长，超出 GitHub 链接容量。请精简正文后重试，或点击「复制投稿内容」后到 GitHub 手动粘贴。",
      copied: "已复制到剪贴板，请到 GitHub 投稿页粘贴提交 →",
    },
    en: {
      busy: "Submitting…",
      uploading: "📎 Uploading file…",
      btn: "📮 Submit",
      ok: "✅ Submitted! Your post has entered the review queue.",
      view: "Track review progress →",
      fail: "Submission failed, please try again later",
      neterr: "❌ Network error: the submission service is unreachable from your network",
      toobig: "File exceeds the 20MB limit",
      badtype: "Unsupported file type — please use PDF / Word / PPT / archives, etc.",
      upfail: "File upload failed: ",
      fallbackTitle: "⚠ The online channel is currently unreachable from your network",
      fallbackHint: "Alternative: submit via GitHub (requires a GitHub account; attachments unsupported; your email is not included).",
      fallbackBtn: "🚀 Submit via GitHub →",
      fallbackOpen: "Open the GitHub submission page",
      fallbackCopy: "📋 Copy my submission",
      fallbackLong: "Content too long for the GitHub link. Please shorten it, or use “Copy my submission” and paste it on GitHub.",
      copied: "Copied! Paste it on the GitHub submission page →",
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

  function val(id) {
    return document.getElementById(id).value.trim();
  }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- 通道 B：生成 GitHub Issue 预填链接 ---------- */
  function collectPayload() {
    var typeInput = form.querySelector('input[name="type"]:checked');
    return {
      type: typeInput ? typeInput.value : "经验分享",
      title: val("csu-f-title"),
      author: val("csu-f-author"),
      email: val("csu-f-email"),
      tags: val("csu-f-tags"),
      content: document.getElementById("csu-f-content").value,
    };
  }
  function buildGithubIssueUrl(p) {
    var line = function (s) { return String(s).replace(/[\r\n]+/g, " "); };
    var meta =
      "<!--CSU-META\n" +
      "title: " + line(p.title) + "\n" +
      "author: " + line(p.author) + "\n" +
      "type: " + line(p.type) + "\n" +
      (p.tags ? "tags: " + line(p.tags) + "\n" : "") +
      "date: " + new Date().toISOString() + "\n" +
      "CSU-META-->\n\n" +
      p.content + "\n";
    return (
      ISSUE_NEW_URL +
      "?title=" + encodeURIComponent("[投稿][" + p.type + "] " + p.title) +
      "&body=" + encodeURIComponent(meta)
    );
  }
  function showFallback(p) {
    var url = buildGithubIssueUrl(p);
    var tooLong = url.length > MAX_URL_LEN;
    var html =
      esc(MSG.fallbackTitle) + "<br>" + esc(MSG.fallbackHint) + "<br><br>";
    if (tooLong) {
      html += esc(MSG.fallbackLong) + "<br><br>";
    }
    if (!tooLong) {
      html +=
        '<a class="csu-dl-btn" target="_blank" rel="noopener" href="' + esc(url) + '">' + esc(MSG.fallbackBtn) + "</a> ";
    }
    html +=
      '<a class="csu-btn" target="_blank" rel="noopener" href="' + ISSUE_NEW_URL + '">' + esc(MSG.fallbackOpen) + "</a> " +
      '<button type="button" class="csu-btn" id="csu-copy-btn">' + esc(MSG.fallbackCopy) + "</button>";
    var box = document.getElementById("csu-submit-result");
    box.hidden = false;
    box.className = "csu-result err";
    box.innerHTML = html;
    document.getElementById("csu-copy-btn").addEventListener("click", function () {
      var line = function (s) { return String(s).replace(/[\r\n]+/g, " "); };
      var full =
        "<!--CSU-META\n" +
        "title: " + line(p.title) + "\n" +
        "author: " + line(p.author) + "\n" +
        "type: " + line(p.type) + "\n" +
        (p.tags ? "tags: " + line(p.tags) + "\n" : "") +
        "date: " + new Date().toISOString() + "\n" +
        "CSU-META-->\n\n" +
        p.content + "\n";
      navigator.clipboard.writeText(full).then(function () {
        var b = document.getElementById("csu-copy-btn");
        b.textContent = MSG.copied;
      });
    });
  }

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

    // 附件校验（仅在线通道支持附件）
    var file = fileBox.hidden ? null : (fileInput.files && fileInput.files[0] ? fileInput.files[0] : null);
    if (file) {
      var ext = (file.name.split(".").pop() || "").toLowerCase();
      if (ALLOWED_EXTS.indexOf(ext) === -1) return show(false, "❌ " + MSG.badtype);
      if (file.size > MAX_FILE_SIZE) return show(false, "❌ " + MSG.toobig);
    }

    var payload = collectPayload();

    var pre = Promise.resolve();
    if (file) {
      setBusy(MSG.uploading);
      var fd = new FormData();
      fd.append("file", file);
      pre = fetch(base + "/api/upload", { method: "POST", body: fd })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.ok) throw new Error((d.error ? d.error + "：" : "") + MSG.upfail);
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
              ? ' <a href="' + d.issue_url + '" target="_blank" rel="noopener">' + esc(MSG.view) + "</a>"
              : ""));
          form.reset();
          fileHint.textContent = "";
        } else {
          show(false, "❌ " + (d.error || MSG.fail));
        }
      })
      .catch(function (err) {
        // 网络不可达等：提供 GitHub 备用通道
        finish();
        showFallback(payload);
        return;
      })
      .finally(finish);
  });
})();
