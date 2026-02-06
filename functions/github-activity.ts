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
    headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
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
    const y = Math.floor(n)
    if (y < 2008 || y > 2100) return 'last'
    return String(y)
}

type GithubActivityApiResponse = {
    total: Record<string, number>
    contributions: Array<{ date: string; count: number; level: number }>
    error?: string
}

const UPSTREAM_BASE = 'https://github-contributions-api.jogruber.de/v4/'

export async function onRequest(context: { request: Request }) {
    const { request } = context

    if (request.method === 'OPTIONS') {
        return withCors(request, new Response(null, { status: 204 }))
    }

    if (request.method !== 'GET') {
        return withCors(request, json({ error: 'method_not_allowed' }, { status: 405 }))
    }

    const url = new URL(request.url)
    const u = (url.searchParams.get('u') || '').trim()
    if (!u) return withCors(request, json({ error: 'missing_user' }, { status: 400 }))
    if (u.length > 64) return withCors(request, json({ error: 'bad_user' }, { status: 400 }))

    const y = normalizeYear(url.searchParams.get('y'))
    const upstream = `${UPSTREAM_BASE}${encodeURIComponent(u)}?y=${encodeURIComponent(y)}`

    const cache = (caches as any).default as Cache | undefined
    const cacheKey = new Request(upstream, { method: 'GET' })
    if (cache) {
        const hit = await cache.match(cacheKey)
        if (hit) return withCors(request, hit)
    }

    let upstreamRes: Response
    try {
        upstreamRes = await fetchWithTimeout(upstream, 10000)
    } catch {
        return withCors(request, json({ error: 'upstream_timeout' }, { status: 504 }))
    }

    let data: GithubActivityApiResponse
    try {
        data = (await upstreamRes.json()) as GithubActivityApiResponse
    } catch {
        return withCors(request, json({ error: 'bad_upstream_json' }, { status: 502 }))
    }

    if (!upstreamRes.ok) {
        return withCors(request, json({ error: data?.error || 'upstream_failed' }, { status: 502 }))
    }

    const ttlSeconds = 60 * 60 * 6 // 6h
    const res = json(data, {
        headers: {
            'Cache-Control': `public, max-age=60, s-maxage=${ttlSeconds}, stale-while-revalidate=86400`,
        },
    })

    if (cache) {
        await cache.put(cacheKey, res.clone())
    }

    return withCors(request, res)
}
