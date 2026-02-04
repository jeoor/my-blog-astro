# Reactions Worker（Cloudflare Workers + KV）

提供两个接口：

- `GET /reactions?post=<postId>`：获取计数 + 当前用户今天是否点过
- `POST /reactions`：提交表情反应（每天每篇每种表情最多一次）

## 部署

1. 安装 wrangler（全局或项目内均可）
2. 创建 KV 命名空间，并把 id 填到 `wrangler.toml` 的 `kv_namespaces` 里（binding 必须是 `REACTIONS_KV`）
3. 设置盐（用于对 IP+UA 做哈希，避免明文存储）

```bash
wrangler secret put REACTIONS_SALT
```

4. 部署

```bash
wrangler deploy
```

## 前端配置

在站点配置文件 `src/site.config.ts` 里设置：

- `likes.endpoint=https://<你的worker域名>`

本地开发时，可以填：

```ts
likes: {
	endpoint: 'http://127.0.0.1:8787',
}
```

然后本地启动 worker：

```bash
wrangler dev
```

说明：站点前端仍保留对环境变量 `PUBLIC_REACTIONS_ENDPOINT` 的兼容兜底，但推荐以 `site.config.ts` 的 `likes.endpoint` 为准，方便集中管理。
