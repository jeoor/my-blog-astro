type KVNamespace = {
    get(key: string): Promise<string | null>
    put(
        key: string,
        value: string,
        options?: {
            expirationTtl?: number
        },
    ): Promise<void>
}

export interface Env {
    REACTIONS_KV: KVNamespace
    REACTIONS_SALT: string
    REACTIONS_TIMEZONE?: string
}

type GithubActivityApiResponse = {
    total: Record<string, number>
    contributions: Array<{ date: string; count: number; level: number }>
    error?: string
}

type Counts = Record<string, number>

type Me = {
    today: Record<string, boolean>
}

function json(data: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
        headers: {
            'content-type': 'application/json; charset=utf-8',
            ...(init?.headers || {}),
        },
        ...init,
    })
}

function withCors(req: Request, res: Response) {
    const origin = req.headers.get('Origin') || '*'
    const headers = new Headers(res.headers)
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
    headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'content-type')
    headers.set('Access-Control-Max-Age', '86400')
    return new Response(res.body, { status: res.status, headers })
}

async function fetchWithTimeout(url: string, timeoutMs = 8000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    try {
        return await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
            },
        })
    } finally {
        clearTimeout(timeoutId)
    }
}

function normalizeYear(input: string | null) {
    if (!input) return 'last'
    if (input === 'last') return 'last'
    const n = Number(input)
    if (!Number.isFinite(n)) return 'last'
    // Clamp to a reasonable range.
    const y = Math.floor(n)
    if (y < 2008 || y > 2100) return 'last'
    return String(y)
}

function getDateString(timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date())

    const y = parts.find((p) => p.type === 'year')?.value
    const m = parts.find((p) => p.type === 'month')?.value
    const d = parts.find((p) => p.type === 'day')?.value
    if (!y || !m || !d) return new Date().toISOString().slice(0, 10)
    return `${y}-${m}-${d}`
}

async function sha256Hex(input: string) {
    const bytes = new TextEncoder().encode(input)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function getUserHash(req: Request, env: Env) {
    const ip = req.headers.get('CF-Connecting-IP') || ''
    const ua = req.headers.get('User-Agent') || ''
    return sha256Hex(`${env.REACTIONS_SALT}|${ip}|${ua}`)
}

function keyCounts(postId: string) {
    return `c:${postId}`
}

function keyUserDay(postId: string, date: string, userHash: string) {
    return `u:${postId}:${date}:${userHash}`
}

async function getCounts(env: Env, postId: string): Promise<Counts> {
    const raw = await env.REACTIONS_KV.get(keyCounts(postId))
    if (!raw) return {}
    try {
        const obj = JSON.parse(raw)
        return obj && typeof obj === 'object' ? (obj as Counts) : {}
    } catch {
        return {}
    }
}

async function putCounts(env: Env, postId: string, counts: Counts) {
    await env.REACTIONS_KV.put(keyCounts(postId), JSON.stringify(counts))
}

async function getMe(env: Env, postId: string, date: string, userHash: string): Promise<Me> {
    const raw = await env.REACTIONS_KV.get(keyUserDay(postId, date, userHash))
    if (!raw) return { today: {} }
    try {
        const obj = JSON.parse(raw)
        const today = obj && typeof obj === 'object' ? (obj.today as Record<string, boolean>) : {}
        return { today: today || {} }
    } catch {
        return { today: {} }
    }
}

async function putMe(env: Env, postId: string, date: string, userHash: string, me: Me) {
    // 给 marker 多留一天 TTL，避免跨时区/缓存造成的重复点击
    await env.REACTIONS_KV.put(keyUserDay(postId, date, userHash), JSON.stringify(me), {
        expirationTtl: 60 * 60 * 48,
    })
}

export default {
    async fetch(req: Request, env: Env): Promise<Response> {
        if (req.method === 'OPTIONS') {
            return withCors(req, new Response(null, { status: 204 }))
        }

        const url = new URL(req.url)
        if (url.pathname === '/github-activity') {
            if (req.method !== 'GET') {
                return withCors(req, json({ error: 'method_not_allowed' }, { status: 405 }))
            }

            const u = (url.searchParams.get('u') || '').trim()
            if (!u) return withCors(req, json({ error: 'missing_user' }, { status: 400 }))
            // Basic sanity limit.
            if (u.length > 64) return withCors(req, json({ error: 'bad_user' }, { status: 400 }))

            const y = normalizeYear(url.searchParams.get('y'))
            const upstream = `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(u)}?y=${encodeURIComponent(y)}`

            const cache = (caches as any).default as Cache | undefined
            const cacheKey = new Request(upstream, { method: 'GET' })
            if (cache) {
                const hit = await cache.match(cacheKey)
                if (hit) {
                    // Re-apply CORS per request origin.
                    return withCors(req, hit)
                }
            }

            let upstreamRes: Response
            try {
                upstreamRes = await fetchWithTimeout(upstream, 10000)
            } catch {
                return withCors(req, json({ error: 'upstream_timeout' }, { status: 504 }))
            }

            let data: GithubActivityApiResponse
            try {
                data = (await upstreamRes.json()) as GithubActivityApiResponse
            } catch {
                return withCors(req, json({ error: 'bad_upstream_json' }, { status: 502 }))
            }

            if (!upstreamRes.ok) {
                return withCors(req, json({ error: data?.error || 'upstream_failed' }, { status: 502 }))
            }

            const ttlSeconds = 60 * 60 * 6 // 6h
            const res = json(data, {
                headers: {
                    // Cache at CDN edge when possible.
                    'Cache-Control': `public, max-age=60, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`,
                },
            })

            if (cache) {
                // Store without per-request CORS headers; we'll add them on the way out.
                await cache.put(cacheKey, res.clone())
            }

            return withCors(req, res)
        }

        if (url.pathname !== '/reactions') {
            return withCors(req, json({ error: 'not_found' }, { status: 404 }))
        }

        const timeZone = env.REACTIONS_TIMEZONE || 'Asia/Shanghai'
        const date = getDateString(timeZone)
        const userHash = await getUserHash(req, env)

        if (req.method === 'GET') {
            const postId = url.searchParams.get('post') || ''
            if (!postId) return withCors(req, json({ error: 'missing_post' }, { status: 400 }))

            const [counts, me] = await Promise.all([getCounts(env, postId), getMe(env, postId, date, userHash)])
            return withCors(req, json({ postId, date, counts, me }))
        }

        if (req.method === 'POST') {
            let body: any
            try {
                body = await req.json()
            } catch {
                return withCors(req, json({ error: 'bad_json' }, { status: 400 }))
            }

            const postId = typeof body?.postId === 'string' ? body.postId : ''
            const reaction = typeof body?.reaction === 'string' ? body.reaction : ''
            if (!postId || !reaction) {
                return withCors(req, json({ error: 'missing_fields' }, { status: 400 }))
            }

            const me = await getMe(env, postId, date, userHash)
            if (me.today[reaction]) {
                return withCors(req, json({ error: 'already_reacted_today' }, { status: 409 }))
            }

            me.today[reaction] = true

            // 注意：KV 的读改写不是强一致/原子操作，高并发下可能丢增量。
            // 个人博客场景一般足够；需要强一致可改用 Durable Object 或 D1。
            const counts = await getCounts(env, postId)
            counts[reaction] = (counts[reaction] || 0) + 1

            await Promise.all([
                putMe(env, postId, date, userHash, me),
                putCounts(env, postId, counts),
            ])

            return withCors(req, json({ postId, date, counts, me }))
        }

        return withCors(req, json({ error: 'method_not_allowed' }, { status: 405 }))
    },
}
