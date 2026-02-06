# MultiTerm Astro 🎨⚡️

**MultiTerm** 是一个面向“喜欢折腾配色方案”的开发者的 Astro 博客主题。你可以用自己钟爱的编辑器配色来主题化整个网站，并让文章内容保持接近原生 Markdown 的清爽审美。

可以看看官方示例站点的这篇文章：[Showing Off Blog Features](https://multiterm.stelclementine.com/posts/showing-off-blog-features)，以及在线 Demo：[multiterm.stelclementine.com](https://multiterm.stelclementine.com)。

> v2.0.0 已发布 🥳

![示例网站截图](https://i.imgur.com/sC8fZGN.png)
![示例网站截图](https://i.imgur.com/Kms96QY.png)
![示例网站截图](https://i.imgur.com/Nrr76Ub.png)
![示例网站截图](https://i.imgur.com/vKxEO5k.png)
![示例网站截图](https://i.imgur.com/wHGGJY9.png)
![示例网站截图](https://i.imgur.com/YerKFZW.png)
![自动生成的社交卡片示例](https://i.imgur.com/4CBBdF3.png)

## ✨ 特性

- **丰富的主题选择**：使用 Expressive Code 内置的 [Shiki 主题](https://expressive-code.com/guides/themes/#available-themes) 来统一站点配色。
- **暗色/亮色/自动模式**：选任意两套 Shiki 主题，通过页头按钮按系统偏好自动切换。
- **多主题选择模式**：选择三套（甚至全部 59 套）主题，让读者在对话框里自由切换；所有元素通过 CSS 变量实时联动换色。
- **评论区（可选）**：可使用 GitHub Discussions + [Giscus](https://giscus.app) 作为评论系统，并与主题配色深度匹配。
- **互动表情（本仓库增强）**：文章底部“点赞/表情反应”组件，支持多表情计数与“每天每篇每种表情一次”的限制（Cloudflare Worker + KV）。
- **GitHub 活动日历（可选）**：首页可显示 GitHub 活动日历，并匹配当前主题（支持同域 Functions/Worker 代理 + 缓存）。
- **Markdown 增强**：Admonitions、侧边固定目录 TOC、emoji shortcode、KaTeX、MDX、阅读时间估算等。
- **RSS & Sitemap**：开箱即用，无需额外配置。
- **社交链接**：页脚可配置常见平台链接（GitHub / Mastodon / Twitter / LinkedIn / Email / RSS 等）。
- **响应式设计**：桌面与移动端适配，基于 [Tailwind v4](https://tailwindcss.com/)。
- **SEO 友好**：内置 SEO 最佳实践，并通过 [Satori](https://github.com/vercel/satori) 自动生成每页社交卡片。
- **构建方式可选**：基于 [Astro](https://astro.build/)，可生成静态站（默认）或动态渲染。

官方示例站点的性能/SEO分析也可以参考：
- PageSpeed：https://pagespeed.web.dev/analysis/https-multiterm-stelclementine-com/qhnp521yci?form_factor=mobile
- OpenGraph：https://www.opengraph.xyz/url/https%3A%2F%2Fmultiterm.stelclementine.com

## 🚀 快速开始

**克隆仓库**：

```bash
git clone --depth 1 https://github.com/stelcodes/multiterm-astro my-new-blog && cd my-new-blog
```

**安装依赖**：

```bash
npm install
```

**启动开发服务器**：

```bash
npm run dev
```

**构建并预览**：

```bash
npm run build && npm run preview
```

## 🛠️ 配置

MultiTerm 的一个核心目标是“配置简单”。绝大多数站点配置集中在一个文件里：`src/site.config.ts`。

内容与文章在 `src/content` 下。你可以删除示例内容并替换成自己的文章。

### 互动表情（Likes / Reactions）

本仓库把原本依赖环境变量的 endpoint 改成了 **统一的配置块**：在 `src/site.config.ts` 的 `likes` 中配置。

- `likes.enabled`：站点级开关（设为 `false` 会全站隐藏）。
- `likes.endpoint`：Cloudflare Worker 的地址（例如 `https://xxx.xxx.workers.dev`）。
- `likes.reactions`：默认表情列表（与 giscus 使用的 GitHub Reactions 8 个表情一致：👍👎😄🎉😕❤️🚀👀）。
- `likes.uiText`：文案（区块标题/提示/状态提示等）。
- `likes.showMissingBackendHint`：未配置 endpoint 时，是否展示提示。

**按文章关闭互动区块**：在文章 frontmatter 里设置：

```yaml
disablelike: true
```

后端 Worker 的部署说明见 [worker/README.md](worker/README.md)。

### GitHub 活动日历（GitHub Activity Calendar）

配置位于 `src/site.config.ts` 的 `githubActivityCalendar`：

- Cloudflare Pages（推荐）：保持默认 `githubActivityCalendar.endpoint='/github-activity'`。
	- 对应 Pages Functions 实现在 `functions/github-activity.ts`，同域请求不需要额外 CORS 配置，并可在边缘缓存。
- 独立 Worker（可选）：设置为 `https://<你的worker域名>/github-activity`。
- 纯静态平台（无 Functions/Worker）：把 `endpoint` 留空，前端会回退到公共上游 API（但可能更慢/不稳定）。

## 📄 许可证

本项目使用 [MIT License](LICENSE.txt)。

## 灵感来源

- https://github.com/panr/hugo-theme-terminal
- https://github.com/chrismwilliams/astro-theme-cactus

## 🩷 赞助

如果你喜欢这个主题，可以考虑请作者喝杯咖啡（支持开源维护）：https://ko-fi.com/stelclementine

[![Star History Chart](https://api.star-history.com/svg?repos=stelcodes/multiterm-astro&type=Date)](https://www.star-history.com/#stelcodes/multiterm-astro&Date)

---

<details>
<summary>English (original)</summary>

# MultiTerm Astro 🎨⚡️

**MultiTerm** is an Astro blog theme designed for coders who love their color schemes. Easily theme your whole website with your favorite color schemes and have your prose rendered with a nod to the aesthetics of raw markdown.

Check out the [Showing Off Blog Features](https://multiterm.stelclementine.com/posts/showing-off-blog-features) post to see all the exciting MultiTerm capabilites on the [live example site](https://multiterm.stelclementine.com)!

> v2.0.0 has been released! 🥳

![Example website screenshot](https://i.imgur.com/sC8fZGN.png)
![Example website screenshot](https://i.imgur.com/Kms96QY.png)
![Example website screenshot](https://i.imgur.com/Nrr76Ub.png)
![Example website screenshot](https://i.imgur.com/vKxEO5k.png)
![Example website screenshot](https://i.imgur.com/wHGGJY9.png)
![Example website screenshot](https://i.imgur.com/YerKFZW.png)
![Example autogenerated social card](https://i.imgur.com/4CBBdF3.png)

## ✨ Features

- **Amazing Theme Selection**: Personalize your blog's appearance with your favorite editor color scheme. Pick your favorite [Shiki themes](https://expressive-code.com/guides/themes/#available-themes) bundled with Expressive Code.
- **Dark/Light/Auto Theme Mode**: Choose any two Shiki themes and use the standard light/dark/auto model for automatically adapting to your reader's theme preferences with button in the site header.
- **Multiple Theme Mode**: Choose three (or all 59!) Shiki themes and allow your reader to choose their favorite from a dialog menu opened from a button in the header. Every element seamlessly changes color interactively using the magic of CSS variables.
- **GitHub Comment Section**: Allow readers to respond, discuss, and react with a comment section powered by GitHub and [Giscus](https://giscus.app). Painstakingly themed to match your site perfectly.
- **GitHub Activity Widget**: Optionally include a statically generated GitHub activity calendar on the homepage that (of course) matches the active color scheme perfectly.
- **Markdown Extensions**: Admonitions, auto-generated TOC that sticks to the side on large screens, emoji shortcodes, KaTeX math, MDX, and reading time estimates. See the example site's [Showing Off Blog Features](https://multiterm.stelclementine.com/posts/showing-off-blog-features) post.
- **RSS Feed and Sitemap**: Built-in support for RSS feeds and sitemap with no extra configuration.
- **Social Links**: Easily include links to common developer platforms including GitHub, Mastodon, Twitter, LinkedIn and E-mail.
- **Responsive Design**: Optimized for all devices from desktops to mobile phones. Built with [Tailwind v4](https://tailwindcss.com/).
- **SEO Optimized**: Boost your site's visibility with built-in SEO best practices and automatically generated social card images for every page via [Satori](https://github.com/vercel/satori).
- **Customizable Build**: Powered by [Astro](https://astro.build/), render as a static site (the default) or generate content dynamically.

Check out the example site [PageSpeed scores](https://pagespeed.web.dev/analysis/https-multiterm-stelclementine-com/qhnp521yci?form_factor=mobile) and [OpenGraph analysis](https://www.opengraph.xyz/url/https%3A%2F%2Fmultiterm.stelclementine.com)

## 🚀 Getting Started

**Clone the Repository**:

```bash
git clone --depth 1 https://github.com/stelcodes/multiterm-astro my-new-blog && cd my-new-blog
```

**Install Dependencies**:

```bash
npm install
```

**Start the Development Server**:

```bash
npm run dev
```

**Build Your Site and View the Results**:

```bash
npm run build && npm run preview
```

## 🛠️ Configuration

Simple configuration is a core feature of MultiTerm. All configuration is done from a single file: `src/site.config.ts`. This is where you can tailor your website to match your vision.

Please take a look at `src/site.config.ts` for more information about the configuration options.

To add your own content, check out the `src/content` directory. Feel free to remove all the example content and replace it with your own!

## 📄 License

This project is licensed under the [MIT License](LICENSE.txt).

## Inspiration

- https://github.com/panr/hugo-theme-terminal
- https://github.com/chrismwilliams/astro-theme-cactus

## 🩷 Sponsor

Consider [buying me a coffee](https://ko-fi.com/stelclementine) to keep me caffeinated while I work on open source projects like this one!

[![Star History Chart](https://api.star-history.com/svg?repos=stelcodes/multiterm-astro&type=Date)](https://www.star-history.com/#stelcodes/multiterm-astro&Date)

</details>
