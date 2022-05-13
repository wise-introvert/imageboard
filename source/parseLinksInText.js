import createLink from 'social-components/utility/post/createLink.js'

const URL_REGEXP = /(?:https?|ftp):\/\/[^\s\/$.?#].[^\s]*/i

/**
 * Finds all plain-text URLs in post `content`
 * and converts them to `{ type: 'link' }` objects.
 * @param  {object} content
 */
export default function parseLinksInText(content) {
	for (const paragraph of content) {
		if (Array.isArray(paragraph)) {
			injectLinks(paragraph)
		}
	}
}

function injectLinks(blocks) {
	let i = 0
	while (i < blocks.length) {
		const subpart = blocks[i]
		if (typeof subpart === 'string') {
			const result = injectLinkIntoString(subpart)
			if (result !== subpart) {
				// blocks = blocks.slice(0, i).concat(result).concat(blocks.slice(i + 1))
				blocks.splice(i, 1, ...result)
				i += result.length
				continue
			}
		}
		i++
	}
	// return blocks
}

function injectLinkIntoString(string) {
	const match = string.match(URL_REGEXP)
	if (match) {
		const url = match[0]
		return [
			string.slice(0, match.index),
			createLink(url),
			string.slice(match.index + url.length)
		].filter(_ => _)
	}
	return string
}