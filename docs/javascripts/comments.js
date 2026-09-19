/**
 * giscus 评论区懒加载器：
 *  - 文章页的 .csu-giscus 容器进入视口附近时，注入 giscus 脚本（GitHub Discussions）；
 *  - 语言跟随站点切换（csu_lang），主题跟随系统深浅色；
 *  - 评论与 👍 点赞都在页面内完成，无需跳转 GitHub。
 */
(function () {
  var containers = document.querySelectorAll(".csu-giscus[data-repo-id]");
  if (!containers.length) return;

  var lang = localStorage.getItem("csu_lang") === "en" ? "en" : "zh-CN";

  function mount(el) {
    if (el.dataset.loaded) return;
    el.dataset.loaded = "1";
    var s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    [
      ["data-repo", el.dataset.repo],
      ["data-repo-id", el.dataset.repoId],
      ["data-category", el.dataset.category],
      ["data-category-id", el.dataset.categoryId],
      ["data-mapping", "pathname"],
      ["data-strict", "1"],
      ["data-reactions-enabled", "1"],
      ["data-emit-metadata", "0"],
      ["data-input-position", "top"],
      ["data-theme", "preferred_color_scheme"],
      ["data-lang", lang],
    ].forEach(function (kv) { s.setAttribute(kv[0], kv[1]); });
    el.textContent = "";
    el.appendChild(s);
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            mount(en.target);
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "300px" }
    );
    containers.forEach(function (el) { io.observe(el); });
  } else {
    containers.forEach(mount);
  }
})();
