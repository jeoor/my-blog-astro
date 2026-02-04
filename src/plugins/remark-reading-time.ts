import type { RemarkPlugin } from '@astrojs/markdown-remark'
import getReadingTime from 'reading-time'
import { toString } from 'mdast-util-to-string'

const remarkReadingTime: RemarkPlugin = (_options?) => {
  return function (tree, { data }) {
    if (data.astro?.frontmatter) {
      const textOnPage = toString(tree)
      const readingTime = getReadingTime(textOnPage)
      const minutes = Math.max(1, Math.ceil(readingTime.minutes || 0))
      data.astro.frontmatter.minutesRead = `约 ${minutes} 分钟阅读`
    }
  }
}

export default remarkReadingTime
