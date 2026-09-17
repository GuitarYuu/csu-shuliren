---
title: "你好，LaTeX —— 示例笔记"
author: "CSU数理人"
date: "2026-09-17"
type: "经验分享"
---

<p class="csu-post-type"><span class="csu-badge tone-violet">经验分享</span><span class="csu-post-date">2026-09-17</span></p>

欢迎来到 **CSU数理人**！这是一篇示例笔记，用来展示本站的排版能力，确认无误后可直接删除。

## 行内公式

著名的欧拉恒等式 $e^{i\pi} + 1 = 0$ 也许是数学中最优美的等式之一。

## 独立公式

高斯积分：

$$
\int_{-\infty}^{+\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## 多行推导

麦克斯韦方程组（部分）：

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0\varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

## 代码块

```python
import numpy as np

A = np.array([[2, 1], [1, 2]])
print(np.linalg.eigvals(A))
```

!!! tip
    投稿 Issue 被打上 `publish` 标签后，GitHub Action 会像本文件一样自动生成 Markdown 并部署上线。
