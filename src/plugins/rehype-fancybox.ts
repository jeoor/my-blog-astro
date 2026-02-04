import type * as hast from 'hast'
import type { RehypePlugin } from '@astrojs/markdown-remark'
import { h } from 'hastscript'

function isElement(node: hast.RootContent | hast.ElementContent): node is hast.Element {
    return (node as hast.Element).type === 'element'
}

function toText(node: hast.Element | hast.Root): string {
    const parts: string[] = []
    const walk = (n: any) => {
        if (!n) return
        if (typeof n === 'string') {
            parts.push(n)
            return
        }
        if (n.type === 'text' && typeof n.value === 'string') {
            parts.push(n.value)
            return
        }
        if (Array.isArray(n.children)) {
            n.children.forEach(walk)
        }
    }
    walk(node)
    return parts.join('').replace(/\s+/g, ' ').trim()
}

function getStringProp(value: unknown): string | undefined {
    if (typeof value === 'string') return value
    if (Array.isArray(value)) {
        const first = value.find((v) => typeof v === 'string')
        return typeof first === 'string' ? first : undefined
    }
    return undefined
}

function getClassList(value: unknown): string[] {
    if (typeof value === 'string') return value.split(/\s+/g).filter(Boolean)
    if (Array.isArray(value)) return value.filter((v) => typeof v === 'string') as string[]
    return []
}

function buildFancyboxAnchor(
    imgEl: hast.Element,
    {
        group,
        caption,
    }: {
        group: string
        caption?: string
    },
): hast.Element {
    const src = getStringProp(imgEl.properties?.src)
    const href = src || '#'
    const props: Record<string, any> = {
        href,
        'data-fancybox': group,
    }
    if (caption) props['data-caption'] = caption

    return h('a', props, [imgEl]) as unknown as hast.Element
}

export const rehypeFancybox: RehypePlugin<
    [
        {
            group?: string
            includeFigureCaption?: boolean
            includeImgTitle?: boolean
            includeImgAlt?: boolean
            excludeClassNames?: string[]
        }?,
    ],
    hast.Root
> = (options) => {
    const group = options?.group ?? 'gallery'
    const includeFigureCaption = options?.includeFigureCaption ?? true
    const includeImgTitle = options?.includeImgTitle ?? true
    const includeImgAlt = options?.includeImgAlt ?? true
    const excludeClassNames = new Set(options?.excludeClassNames ?? ['character-dialogue-image'])

    const isLink = (node: hast.Element | hast.Root | undefined) => {
        return !!node && (node as any).type === 'element' && (node as hast.Element).tagName === 'a'
    }

    const wrapImg = (
        imgEl: hast.Element,
        parent: hast.Element | hast.Root | undefined,
        captionFromFigure?: string,
    ) => {
        if (isLink(parent)) return

        const classList = getClassList(imgEl.properties?.className)
        if (classList.some((c) => excludeClassNames.has(c))) return

        const title = includeImgTitle ? getStringProp(imgEl.properties?.title) : undefined
        const alt = includeImgAlt ? getStringProp(imgEl.properties?.alt) : undefined
        const caption = captionFromFigure || title || alt

        const anchor = buildFancyboxAnchor(imgEl, { group, caption })

        if (parent && Array.isArray((parent as any).children)) {
            const idx = (parent as any).children.indexOf(imgEl)
            if (idx >= 0) {
                ; (parent as any).children[idx] = anchor
            }
        }
    }

    const visit = (node: hast.Root | hast.Element) => {
        const children: any[] | undefined = (node as any).children
        if (!Array.isArray(children) || children.length === 0) return

        for (let i = 0; i < children.length; i += 1) {
            const child = children[i]
            if (!isElement(child)) continue

            if (child.tagName === 'figure') {
                const figureEl = child as hast.Element
                let caption: string | undefined
                if (includeFigureCaption) {
                    const figcaptionEl = figureEl.children.find(
                        (c) => isElement(c) && (c as hast.Element).tagName === 'figcaption',
                    ) as hast.Element | undefined
                    if (figcaptionEl) caption = toText(figcaptionEl)
                }

                const imgChild = figureEl.children.find(
                    (c) => isElement(c) && (c as hast.Element).tagName === 'img',
                ) as hast.Element | undefined
                if (imgChild) wrapImg(imgChild, figureEl, caption)

                visit(figureEl)
                continue
            }

            if (child.tagName === 'img') {
                wrapImg(child as hast.Element, node)
                // If we replaced the child with an <a>, avoid descending into it.
                const updatedChild = children[i]
                if (isElement(updatedChild) && (updatedChild as hast.Element).tagName === 'a') continue
            }

            visit(child as hast.Element)
        }
    }

    return (tree: hast.Root) => {
        visit(tree)
    }
}

export default rehypeFancybox
