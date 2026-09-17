---
title: 首页
description: CSU数理人 · 中南大学数理学习笔记共享站
---

# CSU数理人

<p class="hero-sub">中南大学数理学习笔记共享站 · Markdown + LaTeX · 投稿审核后自动发布</p>

## 📖 关于本站

本站用于沉淀与共享数理学习笔记，内容涵盖数学分析、高等代数、概率统计、数学物理等课程。
所有笔记以**标准 Markdown** 撰写，公式由 **MathJax** 渲染：行内公式 `$...$`，独立公式 `$$...$$`。

<div class="grid cards" markdown>

- :material-math-integral-box: **数学分析** —— 极限 · 连续 · 微分 · 积分 · 级数
- :material-vector-square: **高等代数** —— 行列式 · 矩阵 · 线性空间 · 二次型
- :material-chart-bell-curve: **概率统计** —— 随机变量 · 数字特征 · 参数估计
- :material-atom: **数学物理** —— 数理方程 · 特殊函数 · 力学初步

</div>

## ✍️ 投稿指南

1. 用标准 Markdown 撰写笔记，LaTeX 行内公式用 `$...$`、独立公式用 `$$...$$`，代码用三反引号围栏；
2. 填写下方表单一键提交，正文原文完整保存为 GitHub Issue，进入审核队列；
3. 管理员审核：通过则自动生成文章并部署上线；拒绝则不产生任何文件；
4. 访客对仓库**没有任何写权限**，投稿与站点源码完全隔离。

## 📮 投稿表单

<form id="csu-submit-form" class="csu-form">
  <label for="csu-f-title">文章标题 <span>*</span></label>
  <input id="csu-f-title" name="title" maxlength="120" placeholder="例如：用行列式求四面体体积的一个小技巧" required>
  <label for="csu-f-author">作者署名 <span>*</span></label>
  <input id="csu-f-author" name="author" maxlength="40" placeholder="你的名字或昵称" required>
  <label for="csu-f-email">联系邮箱 <span>*</span>（仅管理员可见，用于通知审核结果）</label>
  <input id="csu-f-email" name="email" type="email" maxlength="80" placeholder="you@example.com" required>
  <label for="csu-f-content">正文 · 标准 Markdown（支持 LaTeX 公式）<span>*</span></label>
  <textarea id="csu-f-content" name="content" rows="14" placeholder="# 小标题&#10;&#10;行内公式 $e^{i\pi}+1=0$，独立公式：&#10;&#10;$$\int_0^1 x^2\,dx=\frac{1}{3}$$" required></textarea>
  <button type="submit" id="csu-f-btn">📮 提交投稿</button>
  <div id="csu-submit-result" class="csu-result" hidden></div>
</form>

!!! note "审核说明"
    - 投稿即表示内容为本人原创或已获授权，仅用于学习交流；
    - **通过**：文章自动生成到站内并部署上线，Issue 自动关闭；
    - **拒绝**：不生成任何文件，Issue 直接关闭；
    - 提交后可打开 Issue 链接查看进度；如需撤稿请在该 Issue 下留言联系管理员。
