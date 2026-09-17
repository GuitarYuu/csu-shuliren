/**
 * MathJax 3 配置（配合 mkdocs.yml 中 pymdownx.arithmatex generic 模式）
 * 行内公式：\( ... \) 或 $...$（arithmatex 已把 $...$ 包成 \( ... \)）
 * 独立公式：\[ ... \] 或 $$...$$
 */
window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    ignoreHtmlClass: "tex2jax_ignore",
    processHtmlClass: "tex2jax_process",
  },
};

// Material 主题页面切换时重新排版公式（未开启 instant 导航时同样安全）
document$.subscribe(function () {
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise().catch(function (e) {
      console.warn("MathJax typeset failed:", e);
    });
  }
});
