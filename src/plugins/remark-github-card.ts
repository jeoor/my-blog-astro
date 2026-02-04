import type { Root, RootContent } from 'mdast'
import type { Plugin } from 'unified'
import type { Directives } from 'mdast-util-directive'
import type { Node, Paragraph as P } from 'mdast'
import { h as _h, type Properties } from 'hastscript'
import siteConfig from '../site.config'

/** Checks if a node is a directive. */
function isNodeDirective(node: Node): node is Directives {
  return (
    node.type === 'containerDirective' ||
    node.type === 'leafDirective' ||
    node.type === 'textDirective'
  )
}

/** From Astro Starlight: Function that generates an mdast HTML tree ready for conversion to HTML by rehype. */
function h(el: string, attrs: Properties = {}, children: any[] = []): P {
  const { properties, tagName } = _h(el, attrs)
  return {
    children: children.filter((child) => !!child),
    data: { hName: tagName, hProperties: properties },
    type: 'paragraph',
  }
}

const DIRECTIVE_NAME = 'github'
const USER_AGENT = 'nodejs'
// 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0',

function githubCardPlaceholderBase(
  attrs: Properties,
  label: string,
  realUrl: string,
  chipClasses: string[],
): P {
  return h('div', { class: 'github-card', ...attrs }, [
    h('div', { class: 'gh-title' }, [
      h('span', { class: 'gh-avatar', 'aria-hidden': 'true' }),
      h('a', { class: 'gh-text', href: realUrl }, [{ type: 'text', value: label }]),
      h('span', { class: 'gh-icon', 'aria-hidden': 'true' }),
    ]),
    h('div', { class: 'gh-description', hidden: true }),
    h(
      'div',
      {
        class: 'gh-chips',
        hidden: true,
      },
      chipClasses.map((className) => h('span', { class: className, hidden: true })),
    ),
  ])
}

function githubCardPlaceholderRepo(owner: string, repo: string, realUrl: string): P {
  return githubCardPlaceholderBase(
    {
      'data-gh-type': 'repo',
      'data-gh-slug': `${owner}/${repo}`,
      'data-gh-url': realUrl,
    },
    `${owner}/${repo}`,
    realUrl,
    ['gh-stars', 'gh-forks', 'gh-license', 'gh-language'],
  )
}

function githubCardPlaceholderUser(user: string, realUrl: string): P {
  return githubCardPlaceholderBase(
    {
      'data-gh-type': 'user',
      'data-gh-slug': user,
      'data-gh-url': realUrl,
    },
    user,
    realUrl,
    ['gh-followers', 'gh-repositories', 'gh-region'],
  )
}

export const remarkGithubCard: Plugin<[], Root> = () => async (tree) => {
  const githubCardsCfg = siteConfig.githubCards ?? {}
  const mode = githubCardsCfg.mode ?? 'client'

  tree.children = await Promise.all(
    tree.children.map(async (node): Promise<RootContent> => {
      if (!isNodeDirective(node)) return node

      // We only want a leaf directive named DIRECTIVE_NAME
      if (node.type !== 'leafDirective' || node.name !== DIRECTIVE_NAME) return node

      let repoName = node.attributes?.repo ?? node.attributes?.user ?? null
      if (!repoName) return node // Leave the directive as-is if no repo is provided

      repoName = repoName.endsWith('/') ? repoName.slice(0, -1) : repoName // Remove trailing slash
      repoName = repoName.startsWith('https://github.com/')
        ? repoName.replace('https://github.com/', '')
        : repoName // Remove leading URL

      const repoParts = repoName.split('/')
      const realUrl = `https://github.com/${repoName}`

      // If its a repo link
      if (repoParts.length > 1) {
        const owner = repoParts[0]
        const repo = repoParts[1]

        if (mode === 'client') {
          return githubCardPlaceholderRepo(owner, repo, realUrl)
        }

        let data: any | null = null
        try {
          const res = await fetch(`https://api.github.com/repos/${repoName}`, {
            headers: {
              'User-Agent': USER_AGENT,
            },
          })
          if (res && res.status === 200) {
            data = await res.json()
          }
        } catch {
          // Network/SSL failures should not break Markdown rendering.
        }

        if (!data) {
          return mode === 'hybrid'
            ? githubCardPlaceholderRepo(owner, repo, realUrl)
            : githubCardPlaceholderRepo(owner, repo, realUrl)
        }

        const description = data.description
          ? data.description.replace(/:[a-zA-Z0-9_]+:/g, '')
          : undefined
        const backgroundImage = data.owner?.avatar_url
        const language = data.language
        const forks = Intl.NumberFormat(undefined, {
          notation: 'compact',
          maximumFractionDigits: 1,
        })
          .format(data.forks)
          .replaceAll('\u202f', '')
        const stars = Intl.NumberFormat(undefined, {
          notation: 'compact',
          maximumFractionDigits: 1,
        })
          .format(data.stargazers_count)
          .replaceAll('\u202f', '')
        const license = data.license?.spdx_id

        return h('div', { class: 'github-card' }, [
          h('div', { class: 'gh-title' }, [
            h('span', {
              class: 'gh-avatar',
              style: `background-image: url('${backgroundImage}')`,
            }),
            h('a', { class: 'gh-text', href: realUrl }, [
              { type: 'text', value: `${owner}/${repo}` },
            ]),
            h('span', { class: 'gh-icon' }),
          ]),
          description &&
          h('div', { class: 'gh-description' }, [
            {
              type: 'text',
              value: description,
            },
          ]),
          h('div', { class: 'gh-chips' }, [
            h('span', { class: 'gh-stars' }, [{ type: 'text', value: stars }]),
            h('span', { class: 'gh-forks' }, [{ type: 'text', value: forks }]),
            license &&
            h('span', { class: 'gh-license' }, [{ type: 'text', value: license }]),
            language &&
            h('span', { class: 'gh-language' }, [{ type: 'text', value: language }]),
          ]),
        ])
      }

      // If its a user link
      else if (repoParts.length === 1) {
        const user = repoParts[0]

        if (mode === 'client') {
          return githubCardPlaceholderUser(user, realUrl)
        }

        let data: any | null = null
        try {
          const res = await fetch(`https://api.github.com/users/${repoName}`, {
            headers: {
              'User-Agent': USER_AGENT,
            },
          })
          if (res && res.status === 200) {
            data = await res.json()
          }
        } catch {
          // Network/SSL failures should not break Markdown rendering.
        }

        if (!data) {
          return mode === 'hybrid'
            ? githubCardPlaceholderUser(user, realUrl)
            : githubCardPlaceholderUser(user, realUrl)
        }

        const backgroundImage = data.avatar_url
        const followers = Intl.NumberFormat(undefined, {
          notation: 'compact',
          maximumFractionDigits: 1,
        })
          .format(data.followers)
          .replaceAll('\u202f', '')
        const repositories = Intl.NumberFormat(undefined, {
          notation: 'compact',
          maximumFractionDigits: 1,
        })
          .format(data.public_repos)
          .replaceAll('\u202f', '')
        const region = data.location

        return h('div', { class: 'github-card' }, [
          h('div', { class: 'gh-title' }, [
            h('span', {
              class: 'gh-avatar',
              style: `background-image: url('${backgroundImage}')`,
            }),
            h('a', { class: 'gh-text', href: realUrl }, [
              { type: 'text', value: user },
            ]),
            h('span', { class: 'gh-icon' }),
          ]),
          h('div', { class: 'gh-chips' }, [
            h('span', { class: 'gh-followers' }, [{ type: 'text', value: followers }]),
            h('span', { class: 'gh-repositories' }, [
              { type: 'text', value: repositories },
            ]),
            region &&
            h('span', { class: 'gh-region' }, [{ type: 'text', value: region }]),
          ]),
        ])
      }

      return node
    }),
  )
}
