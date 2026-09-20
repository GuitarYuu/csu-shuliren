/**
 * CSU数理人 · 站点布局中英文切换
 *  - 仅翻译「网站固有布局」文案（首页区块、表单、导航、栏目名、类型徽章等）；
 *  - 投稿正文与文章内容保持原作者语言，不做翻译；
 *  - 选择保存在 localStorage（csu_lang），刷新后保持。
 */
(function () {
  var STORE_KEY = "csu_lang";

  /* ---------- 带 HTML 的区块文案（data-i18n） ---------- */
  var I18N_HTML = {
    "hero.title": {
      zh: "CSU数理人",
      en: "CSU Math &amp; Physics Notes",
    },
    "hero.sub": {
      zh: "中南大学数理学习笔记共享站<br>把你的<strong>经验</strong>、<strong>灵光</strong>与<strong>宝藏资料</strong>写成可以传递的光",
      en: "The CSU math &amp; physics notes hub<br>Turn your <strong>experience</strong>, <strong>sparks of insight</strong> and <strong>treasured resources</strong> into light that travels.",
    },
    "chip.1": { zh: "🗂️ 3 大栏目", en: "🗂️ 3 categories" },
    "chip.2": { zh: "🧮 Markdown + LaTeX", en: "🧮 Markdown + LaTeX" },
    "chip.3": { zh: "⚡ 审核后自动上线", en: "⚡ Auto-publish after review" },
    "chip.4": { zh: "🛡️ 访客零门槛", en: "🛡️ No account needed" },
    "btn.submit": { zh: "✍️ 我要投稿", en: "✍️ Submit a post" },
    "btn.browse": { zh: "🗂️ 浏览栏目", en: "🗂️ Browse categories" },
    "sec.types": { zh: "🗂️ 发布栏目", en: "🗂️ Categories" },
    "sec.how": { zh: "✨ 如何发布", en: "✨ How it works" },
    "sec.submit": { zh: "📮 投稿", en: "📮 Submit" },
    "sec.notes": { zh: "📌 须知", en: "📌 Notes" },
    "posts.h1": { zh: "笔记文章", en: "Posts" },
    "posts.intro": {
      zh: "所有笔记按栏目自动归档，新文章审核通过后会自动出现在对应栏目中。",
      en: "All notes are automatically archived by category; approved new posts appear in their section automatically.",
    },
    "cat.experience.h1": { zh: "🧭 经验分享", en: "🧭 Experience" },
    "cat.experience.intro": {
      zh: "学习方法、课程攻略、备考心得、竞赛复盘——把走过的路写成路标。",
      en: "Study methods, course guides, exam strategies, contest reviews — turn the road you walked into signposts.",
    },
    "cat.experience.note": {
      zh: "新文章审核通过后会自动出现在左侧列表。想投稿到这个栏目？回到首页投稿表单选择「经验分享」即可。",
      en: "New posts appear in the left list automatically after approval. To submit here, use the form on the home page and choose “Experience”.",
    },
    "cat.insights.h1": { zh: "💡 灵光一现", en: "💡 Insight" },
    "cat.insights.intro": {
      zh: "突然冒出的猜想、巧妙的小证明、漂亮的反例——短小没关系，闪光就好。",
      en: "Sudden conjectures, clever mini proofs, beautiful counterexamples — short is fine, sparkle is what matters.",
    },
    "cat.insights.note": {
      zh: "新文章审核通过后会自动出现在左侧列表。想投稿到这个栏目？回到首页投稿表单选择「灵光一现」即可。",
      en: "New posts appear in the left list automatically after approval. To submit here, use the form on the home page and choose “Insight”.",
    },
    "cat.resources.h1": { zh: "📚 资料汇总", en: "📚 Resources" },
    "cat.resources.intro": {
      zh: "书单、网课、讲义、软件与网站——支持 PDF 等附件下载，附件内容也会被纳入站内搜索。",
      en: "Book lists, online courses, lecture notes, software and sites — supports PDF attachments; attachment text is indexed for site search.",
    },
    "cat.resources.note": {
      zh: "新文章审核通过后会自动出现在左侧列表。想投稿到这个栏目？回到首页投稿表单选择「资料汇总」即可（可附加文件）。",
      en: "New posts appear in the left list automatically after approval. To submit here, use the form on the home page and choose “Resources” (attachments supported).",
    },
    "card.exp.title": { zh: "🧭 经验分享", en: "🧭 Experience" },
    "card.exp.desc": {
      zh: "学习方法、课程攻略、备考心得、竞赛复盘……把走过的路写成路标，照亮学弟学妹的下一步。",
      en: "Study methods, course guides, exam strategies, contest reviews… turn the road you walked into signposts for those who follow.",
    },
    "card.exp.chips": {
      zh: "<span>学习方法</span><span>课程攻略</span><span>竞赛复盘</span><span>保研考研</span>",
      en: "<span>Study tips</span><span>Course guides</span><span>Contest reviews</span><span>Grad school</span>",
    },
    "card.ins.title": { zh: "💡 灵光一现", en: "💡 Insight" },
    "card.ins.desc": {
      zh: "突然冒出的猜想、一段巧妙的小证明、一个漂亮的反例、一道题的神来之笔。短小没关系，闪光就好。",
      en: "A sudden conjecture, a clever mini proof, a beautiful counterexample, a stroke of genius on a problem. Short is fine — sparkle is what matters.",
    },
    "card.ins.chips": {
      zh: "<span>猜想</span><span>小证明</span><span>反例</span><span>一题多解</span>",
      en: "<span>Conjectures</span><span>Mini proofs</span><span>Counterexamples</span><span>Multiple solutions</span>",
    },
    "card.res.title": { zh: "📚 资料汇总", en: "📚 Resources" },
    "card.res.desc": {
      zh: "书单、网课、讲义、软件与网站……做数理人的宝藏仓库管理员，把好东西整理给所有人。",
      en: "Book lists, online courses, lecture notes, software and sites… be the keeper of the community's treasure trove.",
    },
    "card.res.chips": {
      zh: "<span>书单</span><span>网课</span><span>讲义</span><span>工具网站</span>",
      en: "<span>Book lists</span><span>Online courses</span><span>Lecture notes</span><span>Tools &amp; sites</span>",
    },
    "card.link": { zh: "投稿到此栏目 →", en: "Submit to this category →" },
    "step.1": {
      zh: "<strong>挑一个栏目</strong><br>经验分享 / 灵光一现 / 资料汇总",
      en: "<strong>Pick a category</strong><br>Experience / Insight / Resources",
    },
    "step.2": {
      zh: "<strong>表单一键提交</strong><br>Markdown 原文自动存为 GitHub Issue",
      en: "<strong>One-click submit</strong><br>Your Markdown is saved as a GitHub Issue",
    },
    "step.3": {
      zh: "<strong>审核自动上线</strong><br>通过后自动生成文章并部署，无需 PR",
      en: "<strong>Auto-publish on approval</strong><br>Approved posts are generated and deployed automatically — no PR needed",
    },
    "form.type": { zh: "选择栏目 <span>*</span>", en: "Category <span>*</span>" },
    "opt.exp": { zh: "🧭 经验分享", en: "🧭 Experience" },
    "opt.exp.small": { zh: "攻略 · 心得 · 复盘", en: "Guides · Tips · Reviews" },
    "opt.ins": { zh: "💡 灵光一现", en: "💡 Insight" },
    "opt.ins.small": { zh: "猜想 · 点子 · 小证明", en: "Conjectures · Ideas · Mini proofs" },
    "opt.res": { zh: "📚 资料汇总", en: "📚 Resources" },
    "opt.res.small": { zh: "书单 · 网课 · 工具", en: "Books · Courses · Tools" },
    "form.title": { zh: "文章标题 <span>*</span>", en: "Title <span>*</span>" },
    "form.author": { zh: "作者署名 <span>*</span>", en: "Author <span>*</span>" },
    "form.email": {
      zh: "联系邮箱 <span>*</span>（将随投稿公开显示，管理员用它通知审核结果）",
      en: "Email <span>*</span> (shown publicly with your post; admins use it for review updates)",
    },
    "form.content": {
      zh: "正文 · 标准 Markdown（支持 LaTeX 公式）<span>*</span>",
      en: "Content · standard Markdown (LaTeX supported) <span>*</span>",
    },
    "form.file": {
      zh: "📎 附加文件（可选：PDF / Word / PPT / 压缩包等，≤ 20MB）",
      en: "📎 Attachment (optional: PDF / Word / PPT / archives, ≤ 20MB)",
    },
    "form.tags": {
      zh: "标签（可选，逗号分隔，最多 5 个）",
      en: "Tags (optional, comma-separated, up to 5)",
    },
    "form.submit": { zh: "📮 提交投稿", en: "📮 Submit" },
    "note.1": {
      zh: "内容须为<strong>本人原创或已获授权</strong>，禁止抄袭与未授权转载；",
      en: "Content must be <strong>your own or properly licensed</strong>; plagiarism and unauthorized reposting are not allowed;",
    },
    "note.2": {
      zh: "LaTeX 行内公式用 <code>$...$</code>、独立公式用 <code>$$...$$</code>，代码用三反引号围栏；",
      en: "Use <code>$...$</code> for inline LaTeX, <code>$$...$$</code> for display math, and triple backticks for code blocks;",
    },
    "note.3": {
      zh: "标签可选，逗号分隔最多 5 个，便于文章分类检索；",
      en: "Tags are optional — separate with commas, up to 5, to make posts easier to find;",
    },
    "note.4": {
      zh: "「资料汇总」可附加 PDF / Word / PPT / 压缩包等文件（单个 ≤ 20MB），审核通过后可直接在站内下载；",
      en: "“Resources” posts may attach files such as PDF / Word / PPT / archives (≤ 20MB each); after approval they are downloadable on the site;",
    },
    "note.5": {
      zh: "部分网络可能无法在线提交，此时请点击「通过 GitHub 提交」备用按钮（需 GitHub 账号登录）；",
      en: "If online submission is blocked on your network, use the “Submit via GitHub” fallback button (requires signing in to GitHub);",
    },
    "note.6": {
      zh: "文章底部评论区支持评论与点赞，需<strong>登录 GitHub 账号</strong>后操作；",
      en: "The comments and likes section at the bottom of each post requires <strong>signing in with a GitHub account</strong>;",
    },
    "note.7": {
      zh: "投稿后管理员会收到邮件通知，审核通过自动上线；如需撤稿或修改，在对应 Issue 下留言即可。",
      en: "Admins get an email notification for every submission; approved posts go live automatically. To withdraw or revise, comment on the corresponding Issue.",
    },
  };

  /* ---------- 导航/标题等固定短文案（精确匹配替换） ---------- */
  var ZH2EN = {
    "首页": "Home",
    "笔记文章": "Posts",
    "经验分享": "Experience",
    "灵光一现": "Insight",
    "资料汇总": "Resources",
    "🧭 经验分享": "🧭 Experience",
    "💡 灵光一现": "💡 Insight",
    "📚 资料汇总": "📚 Resources",
    "CSU数理人": "CSU Math & Physics Notes",
    "🗂️ 发布栏目": "🗂️ Categories",
    "✨ 如何发布": "✨ How it works",
    "📮 投稿": "📮 Submit",
    "📌 须知": "📌 Notes",
    "💬 评论与点赞": "💬 Comments & likes",
  };
  var EN2ZH = {};
  Object.keys(ZH2EN).forEach(function (k) { EN2ZH[ZH2EN[k]] = k; });

  function currentLang() {
    return localStorage.getItem(STORE_KEY) === "en" ? "en" : "zh";
  }

  function walkText(root, map) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var t = node.nodeValue;
      if (!t) return;
      var trimmed = t.trim();
      if (map[trimmed] !== undefined) node.nodeValue = t.replace(trimmed, map[trimmed]);
    });
  }

  function applyLang(lang) {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";

    // 1) data-i18n 区块（innerHTML，支持 <br>/<strong>/<span>）
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var entry = I18N_HTML[el.getAttribute("data-i18n")];
      if (entry) el.innerHTML = lang === "en" ? entry.en : entry.zh;
    });

    // 2) data-i18n-ph 占位符
    var PH = {
      "ph.title": {
        zh: "例如：用行列式求四面体体积的一个小技巧",
        en: "e.g. A neat determinant trick for tetrahedron volumes",
      },
      "ph.author": { zh: "你的名字或昵称", en: "Your name or nickname" },
      "ph.content": {
        zh: "# 小标题\n\n行内公式 $e^{i\\pi}+1=0$，独立公式：\n\n$$\\int_0^1 x^2\\,dx=\\frac{1}{3}$$",
        en: "# A subtitle\n\nInline math $e^{i\\pi}+1=0$, display math:\n\n$$\\int_0^1 x^2\\,dx=\\frac{1}{3}$$",
      },
      "ph.tags": { zh: "数分, 高代, 考研", en: "calculus, algebra, grad-school" },
    };
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var entry = PH[el.getAttribute("data-i18n-ph")];
      if (entry) el.placeholder = lang === "en" ? entry.en : entry.zh;
    });

    // 3) 导航 / 顶栏 / 目录 / 类型徽章（精确文本替换，不碰正文内容）
    var map = lang === "en" ? ZH2EN : EN2ZH;
    document.querySelectorAll(".md-header, .md-tabs, .md-sidebar, .csu-badge").forEach(function (root) {
      walkText(root, map);
    });

    // 3.5) 内容区 h1 标题（如首页的「首页」；用文本节点替换，保留 permalink 锚点）
    document.querySelectorAll(".md-content h1").forEach(function (h1) {
      walkText(h1, map);
    });

    // 4) 页面标题
    document.title = document.title
      .split(" - ")
      .map(function (part) { return map[part.trim()] !== undefined ? map[part.trim()] : part; })
      .join(" - ");

    // 5) 按钮文案
    var btn = document.getElementById("csu-lang-btn");
    if (btn) btn.textContent = lang === "en" ? "中" : "EN";
  }

  function toggle() {
    var next = currentLang() === "en" ? "zh" : "en";
    localStorage.setItem(STORE_KEY, next);
    applyLang(next);
  }

  function injectButton() {
    var inner = document.querySelector(".md-header__inner");
    if (!inner || document.getElementById("csu-lang-btn")) return;
    var btn = document.createElement("button");
    btn.id = "csu-lang-btn";
    btn.className = "md-header__button csu-lang-btn";
    btn.title = "Switch language / 切换语言";
    btn.textContent = currentLang() === "en" ? "中" : "EN";
    btn.addEventListener("click", toggle);
    var search = inner.querySelector(".md-header__option") || inner.querySelector(".md-search");
    inner.insertBefore(btn, search || inner.lastElementChild);
  }

  injectButton();
  applyLang(currentLang());
})();
