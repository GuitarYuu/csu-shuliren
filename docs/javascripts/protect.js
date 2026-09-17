/**
 * 网页弱防复制保护
 *  1) 禁用右键菜单
 *  2) 禁止文本选中（CSS user-select:none）
 *  3) 拦截 Ctrl+C / Ctrl+X / Ctrl+A 复制类快捷键
 *
 * ⚠️ 重要：这仅仅是"弱防护"——
 *   · 无法阻止系统截图、屏幕录制、手机拍照；
 *   · 访客在浏览器禁用 JavaScript 或使用开发者工具即可完全绕过；
 *   · 不能作为高强度保密手段，仅用于提高随意复制的门槛。
 * 输入框（input/textarea）不受影响，表单打字、粘贴正常。
 */
(function () {
  var style = document.createElement("style");
  style.textContent =
    "body{-webkit-user-select:none;user-select:none}" +
    "input,textarea{-webkit-user-select:text!important;user-select:text!important}";
  document.head.appendChild(style);

  function editable(target) {
    return !!(target && target.closest && target.closest("input,textarea,[contenteditable]"));
  }

  // 1) 右键菜单
  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    toast("右键菜单已禁用");
  });

  // 2) 文本选中
  document.addEventListener("selectstart", function (e) {
    if (!editable(e.target)) e.preventDefault();
  });

  // 3) 复制/剪切事件（含右键菜单里的复制、Ctrl+C/X）
  ["copy", "cut"].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (!editable(e.target)) {
        e.preventDefault();
        toast("内容受保护，禁止复制");
      }
    });
  });

  // 4) 快捷键兜底
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && !editable(e.target)) {
      var k = (e.key || "").toLowerCase();
      if (k === "c" || k === "x" || k === "a") {
        e.preventDefault();
        toast("内容受保护，禁止复制");
      }
    }
  });

  // 底部轻提示
  function toast(msg) {
    var el = document.getElementById("csu-protect-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "csu-protect-toast";
      el.style.cssText =
        "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);" +
        "background:rgba(15,23,42,.88);color:#fff;padding:8px 16px;border-radius:8px;" +
        "font-size:13px;z-index:9999;opacity:0;transition:opacity .25s;pointer-events:none";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () {
      el.style.opacity = "1";
    });
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.style.opacity = "0";
    }, 1400);
  }
})();
