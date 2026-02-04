type Counts = Record<string, number>

type Me = {
    today?: Record<string, boolean>
}

type ReactionsResponse = {
    counts?: Counts
    me?: Me
}

type ReactionDef = {
    key: string
    emoji: string
    name?: string
}

function safeJsonParse<T>(value: string | null): T | null {
    if (!value) return null
    try {
        return JSON.parse(value) as T
    } catch {
        return null
    }
}

async function fetchJson(url: string, init?: RequestInit): Promise<{ res: Response; data: any }> {
    const res = await fetch(url, init)
    const text = await res.text()
    let data: any
    try {
        data = text ? JSON.parse(text) : null
    } catch {
        data = null
    }
    return { res, data }
}

export function initReactions(root: Element | null = document.querySelector('[data-reactions-root]')) {
    if (!root) return

    const postId = root.getAttribute('data-post-id')
    if (!postId) return

    const endpoint =
        root.getAttribute('data-reactions-endpoint') || import.meta.env.PUBLIC_REACTIONS_ENDPOINT

    const ui =
        safeJsonParse<Record<string, string>>(root.getAttribute('data-reactions-ui')) || {}

    const statusEl = root.querySelector('[data-status]') as HTMLElement | null
    const triggerEl = root.querySelector('[data-reactions-trigger]') as HTMLButtonElement | null
    const menuEl = root.querySelector('[data-reactions-menu]') as HTMLElement | null
    const titleEl = root.querySelector('[data-reactions-title]') as HTMLElement | null
    const listEl = root.querySelector('[data-reactions-list]') as HTMLElement | null

    const menuButtons = Array.from(
        root.querySelectorAll('[data-reactions-menu] button[data-reaction]'),
    ) as HTMLButtonElement[]

    const defs: ReactionDef[] = menuButtons
        .map((btn): ReactionDef | null => {
            const key = btn.getAttribute('data-reaction')
            const emoji = btn.getAttribute('data-emoji') || btn.textContent || ''
            const nameAttr = btn.getAttribute('data-name')
            if (!key) return null
            const def: ReactionDef = { key, emoji: emoji.trim() }
            if (nameAttr) def.name = nameAttr
            return def
        })
        .filter((x): x is ReactionDef => x !== null)

    const setStatus = (text: string) => {
        if (statusEl) statusEl.textContent = text
    }

    const defaultTitle =
        ui.pickerTitle ||
        titleEl?.getAttribute('data-default-title') ||
        titleEl?.textContent?.trim() ||
        '选择表情'

    const reactionNameMap: Record<string, string> = {
        like: '赞',
        dislike: '踩',
        laugh: '开心',
        hooray: '庆祝',
        confused: '困惑',
        heart: '喜欢',
        rocket: '火箭',
        eyes: '围观',
    }

    const setTitle = (text: string) => {
        if (!titleEl) return
        titleEl.textContent = text
    }

    const reactionKeyToTitle = (reactionKey: string) => {
        return reactionNameMap[reactionKey] || reactionKey
    }

    const getReactionName = (reactionKey: string) => {
        const def = defs.find((d) => d.key === reactionKey)
        return def?.name || reactionKeyToTitle(reactionKey)
    }

    const state: { counts: Counts; me: Me } = { counts: {}, me: { today: {} } }

    const isUsedToday = (reactionKey: string) => {
        return !!state.me?.today?.[reactionKey]
    }

    const render = () => {
        // Disable menu items if already used today
        for (const btn of menuButtons) {
            const key = btn.getAttribute('data-reaction')
            if (!key) continue
            btn.disabled = isUsedToday(key)
        }

        // Render only reactions with count > 0
        if (!listEl) return
        listEl.innerHTML = ''

        for (const def of defs) {
            const count = state.counts?.[def.key] || 0
            if (count <= 0) continue

            const usedToday = isUsedToday(def.key)

            const pill = document.createElement('button')
            pill.type = 'button'
            pill.className =
                'inline-flex items-center gap-2 rounded-full border-1 bg-background/70 border-foreground/10 h-9 px-3 text-sm text-foreground/85 hover:bg-foreground/4 hover:border-foreground/14 transition-colors disabled:cursor-not-allowed disabled:opacity-100'
            pill.setAttribute('data-reaction', def.key)
            pill.setAttribute('aria-label', `表情：${def.key}`)
            pill.disabled = usedToday

            if (usedToday) {
                pill.className += ' border-accent/30 bg-accent/8'
            }

            const emojiSpan = document.createElement('span')
            emojiSpan.setAttribute('aria-hidden', 'true')
            emojiSpan.className = 'text-base leading-none'
            emojiSpan.textContent = def.emoji

            const countSpan = document.createElement('span')
            countSpan.className = 'tabular-nums text-foreground/80'
            countSpan.textContent = String(count)

            pill.appendChild(emojiSpan)
            pill.appendChild(countSpan)
            pill.addEventListener('click', () => void react(def.key))

            listEl.appendChild(pill)
        }
    }

    const setOpen = (open: boolean) => {
        if (!menuEl || !triggerEl) return
        menuEl.classList.toggle('hidden', !open)
        triggerEl.setAttribute('aria-expanded', open ? 'true' : 'false')
        if (!open) setTitle(defaultTitle)
    }

    const toggle = () => {
        if (!menuEl) return
        setOpen(menuEl.classList.contains('hidden'))
    }

    const base = endpoint ? endpoint.replace(/\/$/, '') : ''

    const load = async () => {
        if (!endpoint) {
            setStatus(ui.statusNotConfigured || '未配置表情后端')
            // Keep UI usable (menu can open), but no data to load.
            for (const btn of menuButtons) btn.disabled = true
            render()
            return
        }

        setStatus(ui.statusLoading || '加载中…')
        const { res, data } = await fetchJson(`${base}/reactions?post=${encodeURIComponent(postId)}`)
        if (!res.ok) {
            setStatus(ui.statusLoadFailed || '加载失败')
            return
        }
        const payload = data as ReactionsResponse | null
        state.counts = payload?.counts || {}
        state.me = payload?.me || { today: {} }
        render()
        setStatus('')
    }

    const react = async (reaction: string) => {
        if (!endpoint) {
            setStatus(ui.statusNotConfigured || '未配置表情后端')
            return
        }

        setStatus(ui.statusSubmitting || '提交中…')
        const { res, data } = await fetchJson(`${base}/reactions`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ postId, reaction }),
        })

        if (res.status === 409) {
            setStatus(ui.statusAlreadyReactedToday || '今天你已经点过这个表情了')
            await load()
            return
        }
        if (!res.ok) {
            setStatus(ui.statusSubmitFailed || '提交失败')
            return
        }

        const payload = data as ReactionsResponse | null
        state.counts = payload?.counts || state.counts
        state.me = payload?.me || state.me
        render()
        setStatus(ui.statusRecorded || '已记录')
        setTimeout(() => setStatus(''), 1200)
    }

    if (triggerEl) {
        triggerEl.addEventListener('click', () => toggle())
    }

    if (menuEl) {
        // Hover/focus on reactions updates the title
        menuEl.addEventListener('pointerover', (e) => {
            const target = e.target as Element | null
            const btn = target?.closest?.('button[data-reaction]') as HTMLButtonElement | null
            const key = btn?.getAttribute('data-reaction')
            if (!key) return
            setTitle(getReactionName(key))
        })

        // When leaving the whole menu, restore the default title
        menuEl.addEventListener('pointerleave', () => {
            setTitle(defaultTitle)
        })

        menuEl.addEventListener('focusin', (e) => {
            const target = e.target as Element | null
            const btn = target?.closest?.('button[data-reaction]') as HTMLButtonElement | null
            const key = btn?.getAttribute('data-reaction')
            if (!key) return
            setTitle(getReactionName(key))
        })

        menuEl.addEventListener('focusout', (e) => {
            const next = (e as FocusEvent).relatedTarget as Node | null
            if (next && menuEl.contains(next)) return
            setTitle(defaultTitle)
        })
    }

    for (const btn of menuButtons) {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-reaction')
            if (!key) return
            setOpen(false)
            void react(key)
        })
    }

    // Click outside / Esc to close
    document.addEventListener('click', (e) => {
        if (!menuEl || !triggerEl) return
        if (menuEl.classList.contains('hidden')) return
        const target = e.target as Node
        if (menuEl.contains(target) || triggerEl.contains(target)) return
        setOpen(false)
    })

    document.addEventListener('keydown', (e) => {
        if (!menuEl) return
        if (e.key !== 'Escape') return
        if (menuEl.classList.contains('hidden')) return
        setOpen(false)
    })

    void load()
}
