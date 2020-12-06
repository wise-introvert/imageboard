import findContentPart from 'social-components/commonjs/utility/post/findContentPart'
import splitContent from 'social-components/commonjs/utility/post/splitContent'

/**
 * Splits `content` into paragraphs where there're two or more `\n` characters.
 * @param  {any} content
 * @return {any} A copy of `content` with paragraphs split.
 */
export default function splitParagraphs(content) {
	let paragraphs = content
	let i = 0
	while (i < content.length) {
		let split
		if (Array.isArray(content[i])) {
			split = splitParagraph(content[i])
		}
		if (Array.isArray(split)) {
			// Initializing `paragraphs` on demand is a minor optimization
			// for cases when paragraphs likely won't be split.
			if (paragraphs === content) {
				paragraphs = paragraphs.slice(0, i)
			}
			paragraphs = paragraphs.concat(split)
		} else {
			// Initializing `paragraphs` on demand is a minor optimization
			// for cases when paragraphs likely won't be split.
			if (paragraphs !== content) {
				paragraphs.push(content[i])
			}
		}
		i++
	}
	return paragraphs
}

const WHITESPACE = /^\s+$/

function findParagraphSplit(content) {
	let skip
	const indexes = findContentPart(content, (part, { getNextPart }) => {
		if (part === '\n') {
			skip = 1
			let nextPart
			while ((nextPart = getNextPart(skip)) !== undefined) {
				if (nextPart === '\n') {
					return true
				}
				if (!WHITESPACE.test(nextPart)) {
					return
				}
				skip++
			}
		}
	})
	if (indexes) {
		return {
			indexes,
			skip
		}
	}
}

function splitParagraph(content) {
	const splitPoint = findParagraphSplit(content)
	if (!splitPoint) {
		return
	}
	const { indexes, skip } = splitPoint
	const [one, two] = splitContent(content, indexes, { skip, include: false })
	// If `content` is `["\n", "\n"]` then both
	// `one` and `two` will be `undefined`.
	if (!one && !two) {
		return
	}
	if (!one) {
		return splitParagraph(two) || [two]
	}
	if (!two) {
		return [one]
	}
	const furtherSplit = splitParagraph(two)
	if (furtherSplit) {
		return [
			one,
			...furtherSplit
		]
	}
	return [one, two]
}