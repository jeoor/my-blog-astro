---
title: '博客功能展示'
published: 2026-02-04

draft: false
tags: ['astro', 'demo', 'markdown']
toc: true
# coverImage:
#   src: './cover.jpg'
#   alt: '一个短发浓密、戴着处方眼镜的人坐在整理有序的工作台前，使用放大工具浏览网页。TA 坐姿端正放松。桌上有：电脑、鼠标、大台灯和一个小笔记本。'
---

由于这篇文章的 frontmatter 中没有提供描述（description），因此会使用第一段作为文章描述。

## 主题

> 为你的博客使用你最喜欢的编辑器主题！

网站的主题来自 Expressive Code 内置的 Shiki 主题。你可以在[这里](https://expressive-code.com/guides/themes/#available-themes)查看可用主题。一个网站可以配置一个或多个主题，配置位置在 `src/site.config.ts`。目前有三种主题模式可选：

1. `single`：为网站选择一个主题。简单直接。
2. `light-dark-auto`：为网站分别选择浅色与深色两个主题。页头会包含一个按钮，用于在 浅色/深色/自动 之间切换。例如，你可以选择 `github-dark` 与 `github-light`，默认设为 `"auto"`，用户的体验会立刻与其操作系统主题保持一致。
3. `select`：为网站选择两个或更多主题，并在页头提供一个按钮，让用户在这些主题间自由切换。你可以加入任意多个来自 Expressive Code 的 Shiki 主题，让用户找到自己最喜欢的主题！

> 当用户切换主题时，他们的偏好会被存储在 `localStorage` 中，从而在页面跳转时也能保持一致。

## 代码块

来看看几种代码块样式：

```python
def hello_world():
    print("Hello, world!")

hello_world()
```

```python title="hello.py"
def hello_world():
    print("Hello, world!")

hello_world()
```

```shell
python hello.py
```

还有一些行内代码：`1 + 2 = 3`。或者甚至是：`(= (+ 1 2) 3)`。

更多可用特性（如文本换行、行高亮、diff 等）请参阅 [Expressive Code 文档](https://expressive-code.com/key-features/syntax-highlighting/)。

## 基础 Markdown 元素

- 列表项 1
- 列表项 2

**加粗文本**

_斜体文本_

~~删除线文本~~

[链接](https://www.example.com)

> 人生如艺术，有些结局总是苦乐参半。尤其是谈到爱情的时候。有时候命运会把两个恋人撮合到一起，却又残忍地将他们拆散。有时候英雄终于做出了正确的选择，却偏偏时机不对。而且，正如人们常说的那样，时机就是一切。
>
> \- 《绯闻女孩》

| 姓名    | 年龄 | 城市        |
| ------- | --- | ----------- |
| Alice   | 30  | New York    |
| Bob     | 25  | Los Angeles |
| Charlie | 35  | Chicago     |

---

## 图片

图片 URL 后可以加一个标题字符串，从而渲染为带 `<figcaption>` 的 `<figure>`。

![一棵树的像素画](https://cdn.jsdmirror.com/gh/jeoor/img@main/logo/logo_d.png '如果没有合适的 CSS，像素画会渲染得很糟糕')

```md title="像素画 Markdown" wrap
![一棵树的像素画](https://cdn.jsdmirror.com/gh/jeoor/img@main/logo/logo_d.pngg '如果没有合适的 CSS，像素画会渲染得很糟糕')
```

我还为像素画添加了一个特殊标签，用于注入正确的 CSS 以实现像素风的正确渲染。只需要在 alt 文本末尾添加 `#pixelated` 即可。

![一棵树的像素画 #pixelated](https://cdn.jsdmirror.com/gh/jeoor/img@main/logo/logo_d.png '在 alt 文本末尾添加 #pixelated 可以修复这个问题')

```md title="带 #pixelated 的像素画 Markdown" wrap
![一棵树的像素画 #pixelated](https://cdn.jsdmirror.com/gh/jeoor/img@main/logo/logo_d.png '在 alt 文本末尾添加 #pixelated 可以修复这个问题')
```

## 提示块（Admonitions）

```md title="Markdown 中的提示块示例"
:::note
testing123
:::
```

:::note
testing123
:::

:::tip
testing123
:::

:::important
testing123
:::

:::caution
testing123
:::

:::warning
testing123
:::

## 角色对话

```md title="自定义角色对话" wrap
:::dog
**你知道吗？** 你可以使用 MultiTerm 轻松为博客创建自定义角色对话！
:::
```

:::dog
**你知道吗？** 你可以使用 MultiTerm 轻松为博客创建自定义角色对话！
:::

### 添加你自己的角色

要添加你自己的角色，先把一张图片文件放到你克隆的 MultiTerm 仓库的顶层 `/public` 目录中。Astro 无法自动优化来自 Markdown 插件的图片资源，所以请务必把图片压缩到适合网页的大小（<100kb）。

我推荐使用 Google 免费的 [Squoosh](https://squoosh.app) 网页应用来生成体积很小的 webp 文件。这里的角色图片被调整为 300 像素宽，并通过 Squoosh 以 75% 质量导出为 webp。

添加图片后，更新 `site.config.ts` 里的 `characters` 配置项，指向你新加入的图片文件，并重启开发服务器。

### 角色对话的连续效果

当连续出现多个角色对话时，对话头像与气泡的顺序会反转，从而形成更像“你来我往”的对话效果。

```md title="连续的角色对话"
:::boy_dog
这是个很酷的功能！
:::

:::old_dog
我同意！
:::
```

:::boy_dog
这是个很酷的功能！
:::

:::old_dog
我同意！
:::

你也可以指定对齐方式（`left` 或 `right`），用来覆盖默认的 `left, right, left, ...` 交替顺序。

```md wrap title="指定对齐方式的角色对话"
:::old_dog{align="right"}
在这边，右侧！
:::
```

:::old_dog{align="right"}
在这边，右侧！
:::

## GitHub 卡片

GitHub 概览卡片的灵感主要来自 [Astro Cactus](https://github.com/chrismwilliams/astro-theme-cactus)。

```md title="Markdown 中的 GitHub 仓库卡片示例"
::github{repo="stelcodes/multiterm-astro"}
```

::github{repo="stelcodes/multiterm-astro"}

```md wrap=true title="Markdown 中的 GitHub 用户卡片示例"
::github{user="withastro"}
```

::github{user="withastro"}

## 表情符号 :star_struck:

在 Markdown 中添加表情符号，你可以直接写一个表情字符，或者使用 GitHub shortcode。你可以在[这里](https://emojibase.dev/emojis?shortcodePresets=github)浏览一个非官方数据库。

```md title="使用 GitHub emoji shortcodes 的 Markdown 示例"
Good morning! :sleeping: :coffee: :pancakes:
```

Good morning! :sleeping: :coffee: :pancakes:

> 所有表情符号（无论是直接字符还是 shortcode）都会通过类似下面的方式包裹在一个 `span` 标签里，从而更易于无障碍访问：
>
> ```html
> <span role="img" aria-label="coffee">☕️</span>
> ```
>
> 写这段内容时，[emoji v16](https://emojipedia.org/emoji-16.0) 还不受支持。这些新表情可以直接写字符，但没有 shortcodes，因此也不会被包裹。

## LaTeX/KaTeX 数学公式支持

你也可以通过 [remark-math 和 rehype-katex](https://github.com/remarkjs/remark-math) 来显示行内数学公式。

```txt title="使用 KaTeX 渲染行内公式"
让这些公式更完美! $ \frac{a}{b} \cdot b = a $
```

让这些公式更完美! $ \frac{a}{b} \cdot b = a $

你可以查看 [KaTeX 文档](https://katex.org/docs/supported)了解更多语法。

```md title="渲染 KaTeX 块级公式" wrap
$$
a + ar + ar^2 + ar^3 + \dots + ar^{n-1} = \displaystyle\sum_{k=0}^{n - 1}ar^k = a \bigg(\dfrac{1 - r^n}{1 -r}\bigg)
$$
```

$$
a + ar + ar^2 + ar^3 + \dots + ar^{n-1} = \displaystyle\sum_{k=0}^{n - 1}ar^k = a \bigg(\dfrac{1 - r^n}{1 -r}\bigg)
$$

## HTML 元素

<button>一个按钮</button>

### 带输入框的 Fieldset

<fieldset>
    <input type="text" placeholder="输入点内容"><br>
    <input type="number" placeholder="输入数字"><br>
    <input type="text" value="输入值"><br>
    <select>
        <option value="1">选项 1</option>
        <option value="2">选项 2</option>
        <option value="3">选项 3</option>
    </select><br>
    <textarea placeholder="输入评论..."></textarea><br>
    <label><input type="checkbox"> 我已理解<br></label>
    <button type="submit">提交</button>
</fieldset>

### 带标签的表单

<form>
<label>
    <input type="radio" name="fruit" value="apple">
    苹果
</label><br>

<label>
    <input type="radio" name="fruit" value="banana">
    香蕉
</label><br>

<label>
    <input type="radio" name="fruit" value="orange">
    橙子
</label><br>

<label>
    <input type="radio" name="fruit" value="grape">
    葡萄
</label><br>

<label>
    <input type="checkbox" name="terms" value="agree">
    我同意条款与条件
</label><br>

<button type="submit">提交</button>
</form>
