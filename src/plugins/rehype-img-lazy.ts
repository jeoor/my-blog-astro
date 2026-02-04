import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'

export interface RehypeImgLazyOptions {
    /**
     * Class names to skip when applying lazy-loading.
     * Useful when some images must stay eager or are handled differently.
     */
    excludeClassNames?: string[]

    /**
     * Also set decoding="async" (only when missing).
     */
    setDecodingAsync?: boolean
}

function getClassList(value: unknown): string[] {
    if (typeof value === 'string') return value.split(/\s+/g).filter(Boolean)
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[]
    return []
}

const rehypeImgLazy: Plugin<[RehypeImgLazyOptions?], Root> = (options) => {
    const exclude = new Set(options?.excludeClassNames ?? [])
    const setDecodingAsync = options?.setDecodingAsync ?? true

    return function transformer(tree) {
        visit(tree, 'element', (node) => {
            const el = node as Element
            if (el.tagName !== 'img') return

            const classList = getClassList(el.properties?.className)
            if (classList.some((c) => exclude.has(c))) return

            // Only set when missing; respect author-specified loading behavior.
            if (!el.properties) el.properties = {}
            if (el.properties.loading === undefined) {
                el.properties.loading = 'lazy'
            }
            if (setDecodingAsync && el.properties.decoding === undefined) {
                el.properties.decoding = 'async'
            }
        })
    }
}

export default rehypeImgLazy
