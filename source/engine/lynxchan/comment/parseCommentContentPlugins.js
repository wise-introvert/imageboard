import createLink from '../../../utility/createLink'
import dropQuoteMarker from '../../../dropQuoteMarker'
import parsePostLink from '../../../parsePostLink'

const bold = {
	tag: 'strong',
	createBlock(content) {
		return {
			type: 'text',
			style: 'bold',
			content
		}
	}
}

const italic = {
	tag: 'em',
	createBlock(content) {
		return {
			type: 'text',
			style: 'italic',
			content
		}
	}
}

const underline = {
	tag: 'u',
	createBlock(content) {
		return {
			type: 'text',
			style: 'underline',
			content
		}
	}
}

const strikethrough = {
	tag: 's',
	createBlock(content) {
		return {
			type: 'text',
			style: 'strikethrough',
			content
		}
	}
}

const spoiler = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'spoiler'
		}
	],
	createBlock(content) {
		return {
			type: 'spoiler',
			content
		}
	}
}

const quote = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'greenText'
		}
	],
	createBlock(content) {
		content = dropQuoteMarker(content)
		if (content) {
			return {
				type: 'quote',
				block: true,
				content
			}
		}
	}
}

// `lynxchan` has regular quotes and "inverse" (orange) quotes.
const inverseQuote = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'orangeText'
		}
	],
	createBlock(content) {
		content = dropQuoteMarker(content, '<')
		if (content) {
			return {
				type: 'quote',
				// kind: 'inverse-orange',
				kind: 'inverse',
				block: true,
				content
			}
		}
	}
}

// `8ch.net` "ASCII art" or "ShiftJIS art".
const asciiOrShiftJISArt = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'aa'
		}
	],
	createBlock(content) {
		return {
			type: 'text',
			style: 'ascii-shift-jis-art',
			content
		}
	}
}

// Red heading.
const heading = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'redText'
		}
	],
	createBlock(content) {
		return {
			type: 'text',
			style: 'heading',
			content
		}
	}
}

const postLink = {
	tag: 'a',
	attributes: [{
		name: 'class',
		value: 'quoteLink'
	}],
	createBlock(content, util, { commentUrlParser }) {
		const postLink = parsePostLink(util.getAttribute('href'), { commentUrlParser })
		return {
			type: 'post-link',
			boardId: postLink.boardId || null, // Will be set later in comment post-processing.
			threadId: postLink.threadId || null, // Will be set later in comment post-processing.
			postId: postLink.postId,
			content: content.slice('>>'.length),
			url: null // Will be set later in comment post-processing.
		}
	}
}

const link = {
	tag: 'a',
	createBlock(content, util, { commentUrlParser }) {
		// "https://google.de/"
		return createLink(util.getAttribute('href'), content)
	}
}

export default [
	bold,
	italic,
	underline,
	strikethrough,
	spoiler,
	quote,
	inverseQuote,
	asciiOrShiftJISArt,
	heading,
	postLink,
	link
]