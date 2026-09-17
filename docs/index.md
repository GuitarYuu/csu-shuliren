---
title: 首页
description: CSU数理人 · 中南大学数理学习笔记共享站
---

<div class="csu-hero">
  <p class="csu-hero-kicker">CSU · MATH &amp; PHYSICS NOTES</p>
  <p class="csu-hero-title" data-i18n="hero.title">CSU数理人</p>
  <p class="csu-hero-sub" data-i18n="hero.sub">中南大学数理学习笔记共享站<br>把你的<strong>经验</strong>、<strong>灵光</strong>与<strong>宝藏资料</strong>写成可以传递的光</p>
  <p class="csu-hero-chips">
    <span class="csu-chip" data-i18n="chip.1">🗂️ 3 大栏目</span>
    <span class="csu-chip" data-i18n="chip.2">🧮 Markdown + LaTeX</span>
    <span class="csu-chip" data-i18n="chip.3">⚡ 审核后自动上线</span>
    <span class="csu-chip" data-i18n="chip.4">🛡️ 访客零门槛</span>
  </p>
  <p class="csu-hero-actions">
    <a class="csu-btn csu-btn-primary" href="#csu-submit" data-i18n="btn.submit">✍️ 我要投稿</a>
    <a class="csu-btn" href="#csu-types" data-i18n="btn.browse">🗂️ 浏览栏目</a>
  </p>
</div>

<h2 id="csu-types" data-i18n="sec.types">🗂️ 发布栏目</h2>

<div class="csu-cards">
  <div class="csu-card tone-violet">
    <span class="csu-card-cat">EXPERIENCE</span>
    <p class="csu-card-title" data-i18n="card.exp.title">🧭 经验分享</p>
    <p class="csu-card-desc" data-i18n="card.exp.desc">学习方法、课程攻略、备考心得、竞赛复盘……把走过的路写成路标，照亮学弟学妹的下一步。</p>
    <p class="csu-card-chips" data-i18n="card.exp.chips"><span>学习方法</span><span>课程攻略</span><span>竞赛复盘</span><span>保研考研</span></p>
    <a class="csu-card-link" href="#csu-submit" data-i18n="card.link">投稿到此栏目 →</a>
  </div>
  <div class="csu-card tone-amber">
    <span class="csu-card-cat">INSIGHT</span>
    <p class="csu-card-title" data-i18n="card.ins.title">💡 灵光一现</p>
    <p class="csu-card-desc" data-i18n="card.ins.desc">突然冒出的猜想、一段巧妙的小证明、一个漂亮的反例、一道题的神来之笔。短小没关系，闪光就好。</p>
    <p class="csu-card-chips" data-i18n="card.ins.chips"><span>猜想</span><span>小证明</span><span>反例</span><span>一题多解</span></p>
    <a class="csu-card-link" href="#csu-submit" data-i18n="card.link">投稿到此栏目 →</a>
  </div>
  <div class="csu-card tone-blue">
    <span class="csu-card-cat">RESOURCES</span>
    <p class="csu-card-title" data-i18n="card.res.title">📚 资料汇总</p>
    <p class="csu-card-desc" data-i18n="card.res.desc">书单、网课、讲义、软件与网站……做数理人的宝藏仓库管理员，把好东西整理给所有人。</p>
    <p class="csu-card-chips" data-i18n="card.res.chips"><span>书单</span><span>网课</span><span>讲义</span><span>工具网站</span></p>
    <a class="csu-card-link" href="#csu-submit" data-i18n="card.link">投稿到此栏目 →</a>
  </div>
</div>

<h2 id="csu-how" data-i18n="sec.how">✨ 如何发布</h2>

<div class="csu-steps">
  <div class="csu-step"><span class="csu-step-num">1</span><p data-i18n="step.1"><strong>挑一个栏目</strong><br>经验分享 / 灵光一现 / 资料汇总</p></div>
  <div class="csu-step"><span class="csu-step-num">2</span><p data-i18n="step.2"><strong>表单一键提交</strong><br>Markdown 原文自动存为 GitHub Issue</p></div>
  <div class="csu-step"><span class="csu-step-num">3</span><p data-i18n="step.3"><strong>审核自动上线</strong><br>通过后自动生成文章并部署，无需 PR</p></div>
</div>

<h2 id="csu-submit" data-i18n="sec.submit">📮 投稿</h2>

<form id="csu-submit-form" class="csu-form">
  <label data-i18n="form.type">选择栏目 <span>*</span></label>
  <div class="csu-type-picker">
    <label class="csu-type-opt tone-violet"><input type="radio" name="type" value="经验分享" checked><b data-i18n="opt.exp">🧭 经验分享</b><small data-i18n="opt.exp.small">攻略 · 心得 · 复盘</small></label>
    <label class="csu-type-opt tone-amber"><input type="radio" name="type" value="灵光一现"><b data-i18n="opt.ins">💡 灵光一现</b><small data-i18n="opt.ins.small">猜想 · 点子 · 小证明</small></label>
    <label class="csu-type-opt tone-blue"><input type="radio" name="type" value="资料汇总"><b data-i18n="opt.res">📚 资料汇总</b><small data-i18n="opt.res.small">书单 · 网课 · 工具</small></label>
  </div>
  <label for="csu-f-title" data-i18n="form.title">文章标题 <span>*</span></label>
  <input id="csu-f-title" name="title" maxlength="120" data-i18n-ph="ph.title" placeholder="例如：用行列式求四面体体积的一个小技巧" required>
  <label for="csu-f-author" data-i18n="form.author">作者署名 <span>*</span></label>
  <input id="csu-f-author" name="author" maxlength="40" data-i18n-ph="ph.author" placeholder="你的名字或昵称" required>
  <label for="csu-f-email" data-i18n="form.email">联系邮箱 <span>*</span>（仅管理员可见，用于通知审核结果）</label>
  <input id="csu-f-email" name="email" type="email" maxlength="80" placeholder="you@example.com" required>
  <label for="csu-f-content" data-i18n="form.content">正文 · 标准 Markdown（支持 LaTeX 公式）<span>*</span></label>
  <textarea id="csu-f-content" name="content" rows="14" data-i18n-ph="ph.content" placeholder="# 小标题&#10;&#10;行内公式 $e^{i\pi}+1=0$，独立公式：&#10;&#10;$$\int_0^1 x^2\,dx=\frac{1}{3}$$" required></textarea>
  <button type="submit" id="csu-f-btn" data-i18n="form.submit">📮 提交投稿</button>
  <div id="csu-submit-result" class="csu-result" hidden></div>
</form>

<h2 id="csu-notes" data-i18n="sec.notes">📌 须知</h2>

<ol>
  <li data-i18n="note.1">内容须为<strong>本人原创或已获授权</strong>，禁止抄袭与未授权转载；</li>
  <li data-i18n="note.2">LaTeX 行内公式用 <code>$...$</code>、独立公式用 <code>$$...$$</code>，代码用三反引号围栏；</li>
  <li data-i18n="note.3"><strong>通过</strong>：文章自动生成并部署上线，Issue 自动关闭并通知你；<strong>拒绝</strong>：不生成任何文件；</li>
  <li data-i18n="note.4">站点启用了轻量防复制（禁右键 / 禁选中），<strong>该措施无法阻止截图与拍照，仅供参考</strong>；</li>
  <li data-i18n="note.5">如需撤稿或修改，在对应 Issue 下留言联系管理员。</li>
</ol>
