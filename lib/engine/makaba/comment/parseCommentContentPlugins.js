import dropQuoteMarker from '../../../dropQuoteMarker.js'
import createLink from '../../../utility/createLink.js'

const inlineQuote = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'unkfunc'
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

const quote = {
	tag: 'div',
	attributes: [
		{
			name: 'class',
			value: 'quote'
		}
	],
	createBlock(content) {
		return {
			type: 'quote',
			block: true,
			content
		}
	}
}

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

// There's `<b>` in a pinned index post in `/sn/`, for example.
const boldLegacy = {
	tag: 'b',
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

// There seems to be no `<i>`s on 2ch.hk.
// Still some "advanced" users (like moderators) may potentially
// use it in their "advanced" custom markup (like pinned index posts).
const italicLegacy = {
	tag: 'i',
	createBlock(content) {
		return {
			type: 'text',
			style: 'italic',
			content
		}
	}
}

const subscript = {
	tag: 'sub',
	createBlock(content) {
		return {
			type: 'text',
			style: 'subscript',
			content
		}
	}
}

const superscript = {
	tag: 'sup',
	createBlock(content) {
		return {
			type: 'text',
			style: 'superscript',
			content
		}
	}
}

const strikethrough = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 's'
		}
	],
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

const underline = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'u'
		}
	],
	createBlock(content) {
		return {
			type: 'text',
			style: 'underline',
			content
		}
	}
}

// Sometimes moderators use direct HTML markup in opening posts.
const underlineTag = {
	tag: 'u',
	createBlock(content) {
		return {
			type: 'text',
			style: 'underline',
			content
		}
	}
}

const overline = {
	tag: 'span',
	attributes: [
		{
			name: 'class',
			value: 'o'
		}
	],
	createBlock(content) {
		return {
			type: 'text',
			style: 'overline',
			content
		}
	}
}

const link = {
	tag: 'a',
	createBlock(content, util) {
		// Both board page and thread page:
		// `<a href="/b/res/197765456.html#197791215" class="post-reply-link" data-thread="197765456" data-num="197791215">&gt;&gt;197791215</a>`
		const href = util.getAttribute('href')
		if (util.hasAttribute('data-thread')) {
			const threadId = util.getAttribute('data-thread')
			const postId = util.getAttribute('data-num')
			// There have been cases when this regexp didn't match.
			const boardIdMatch = href.match(/^\/([^\/]+)/)
			if (boardIdMatch) {
				return {
					type: 'post-link',
					boardId: boardIdMatch[1],
					threadId: parseInt(threadId),
					postId: parseInt(postId),
					content: content.slice('>>'.length),
					url: `https://2ch.hk${href}`
				}
			}
		}
		return createLink(href, content)
	}
}

// There's some `style` in a pinned index post in `/sn/`, for example.
const style = {
	tag: 'style',
	createBlock() {
		return
	}
}

// There's some `script` in a pinned index post in `/sn/`, for example.
const script = {
	tag: 'script',
	createBlock() {
		return
	}
}

// // Don't know what's this for.
// // <span class="thanks-abu" style="color: red;">Абу благословил этот пост.</span>
// const parseThanksAbu = {
// 	tag: 'span',
// 	attributes: [
// 		{
// 			name: 'class',
// 			value: 'thanks-abu'
// 		}
// 	],
// 	createBlock() {
// 		return
// 	}
// }

export default [
	inlineQuote,
	quote,
	link,
	bold,
	boldLegacy,
	italic,
	italicLegacy,
	strikethrough,
	underline,
	underlineTag,
	overline,
	spoiler,
	subscript,
	superscript,
	style,
	script
]