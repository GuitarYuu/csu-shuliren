/**
 * 评论区：从收件箱仓库的 Issue 拉取评论与点赞数，渲染在文章末尾。
 *  - 数据源：api.github.com（公开 Issue，国内可直连）；
 *  - 展示前 5 条，更多时出现「展开全部 N 条评论」按钮；
 *  - 「💬 去评论 / 👍 点赞」按钮跳转 GitHub Issue 页（登录后评论、点 👍 表情）；
 *  - 文案跟随站点语言（csu_lang）。
 */
(function () {
  var sections = document.querySelectorAll(".csu-comments[data-issue]");
  if (!sections.length) return;

  var lang = localStorage.getItem("csu_lang") === "en" ? "en" : "zh";
  var T = {
    zh: {
      loading: "评论加载中…",
      none: "暂无评论，快来抢沙发～",
      fail: "评论加载失败（GitHub 接口暂时不可用）",
      expand: "展开全部 {n} 条评论",
      collapse: "收起评论",
      likes: "👍 {n}",
      goto: "💬 去评论 / 👍 点赞",
      visit: "前往 GitHub Issue 页，登录后即可评论或给 👍 点赞。",
      preview: "预览已截断，查看全文请点上方按钮。",
    },
    en: {
      loading: "Loading comments…",
      none: "No comments yet — be the first!",
      fail: "Failed to load comments (GitHub API temporarily unavailable)",
      expand: "Show all {n} comments",
      collapse: "Collapse comments",
      likes: "👍 {n}",
      goto: "💬 Comment / 👍 Like",
      visit: "Open the GitHub issue, sign in to comment or leave a 👍.",
      preview: "Preview truncated — use the button above to view everything.",
    },
  }[lang];

  function fill(tpl, n) { return tpl.replace("{n}", n); }
  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function timeAgo(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    var s = (Date.now() - d.getTime()) / 1000;
    if (s < 3600) return Math.max(1, Math.floor(s / 60)) + (lang === "en" ? " min ago" : " 分钟前");
    if (s < 86400) return Math.floor(s / 3600) + (lang === "en" ? " h ago" : " 小时前");
    if (s < 86400 * 30) return Math.floor(s / 86400) + (lang === "en" ? " d ago" : " 天前");
    return iso.slice(0, 10);
  }

  sections.forEach(function (sec) {
    var issue = sec.getAttribute("data-issue");
    var repo = sec.getAttribute("data-repo");
    var list = sec.querySelector('[data-role="list"]');
    var meta = sec.querySelector('[data-role="meta"]');
    if (!issue || !repo || !list) return;

    var gh = function (p) {
      return fetch("https://api.github.com" + p, {
        headers: { Accept: "application/vnd.github+json" },
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    };

    Promise.all([
      gh("/repos/" + repo + "/issues/" + issue + "/comments?per_page=100"),
      gh("/repos/" + repo + "/issues/" + issue + "/reactions").catch(function () { return []; }),
    ])
      .then(function (res) {
        var comments = res[0];
        var reactions = Array.isArray(res[1]) ? res[1] : [];
        var likes = 0;
        reactions.forEach(function (r) { if (r.content === "+1") likes++; });

        if (meta) {
          meta.innerHTML =
            '<span class="csu-cm-like">' + fill(T.likes, likes) + "</span>" +
            ' · <a href="https://github.com/' + repo + '/issues/' + issue +
            '" target="_blank" rel="noopener">' + esc(T.visit) + "</a>";
        }

        if (!comments.length) {
          list.innerHTML = '<p class="csu-cm-meta">' + esc(T.none) + "</p>";
          return;
        }

        var COLLAPSE_AFTER = 5;
        var collapsed = comments.length > COLLAPSE_AFTER;
        var html = "";
        comments.forEach(function (c, idx) {
          if (collapsed && idx >= COLLAPSE_AFTER) {
            html += '<div class="csu-cm csu-cm-extra" hidden>';
          } else {
            html += '<div class="csu-cm">';
          }
          html +=
            '<img class="csu-cm-avatar" src="' + esc(c.user.avatar_url) + '&s=40" alt="" loading="lazy">' +
            '<div class="csu-cm-body"><div class="csu-cm-head"><b>' + esc(c.user.login) + "</b>" +
            '<span class="csu-cm-time">' + esc(timeAgo(c.created_at)) + "</span></div>" +
            '<div class="csu-cm-text">' + esc(c.body).replace(/\n/g, "<br>") + "</div></div>";
          html += "</div>";
        });
        if (collapsed) {
          html +=
            '<button type="button" class="csu-btn csu-cm-expand">' +
            esc(fill(T.expand, comments.length)) + "</button>";
        }
        list.innerHTML = html;

        var expandBtn = list.querySelector(".csu-cm-expand");
        if (expandBtn) {
          expandBtn.addEventListener("click", function () {
            var flip = list.querySelectorAll(".csu-cm-extra");
            var showing = flip.length && !flip[0].hidden;
            flip.forEach(function (el) { el.hidden = showing; });
            expandBtn.textContent = showing
              ? esc(fill(T.expand, comments.length))
              : esc(T.collapse);
          });
        }
      })
      .catch(function () {
        list.innerHTML = '<p class="csu-cm-meta">' + esc(T.fail) + "</p>";
      });
  });
})();
