import parseCommentContent from './parseCommentContent'
import splitParagraphs from './splitParagraphs'
import postProcessCommentContent from './postProcessCommentContent'
import trimContent from 'social-components/commonjs/utility/post/trimContent'

export default function parseAndFormatCommentContent(rawComment, {
	commentUrlParser,
	parseCommentContentPlugins,
	// These're used by `postProcessCommentContent`
	comment,
	boardId,
	threadId,
	messages,
	commentUrl,
	emojiUrl,
	toAbsoluteUrl
}) {
	let content = parseCommentContent(rawComment, {
		commentUrlParser,
		emojiUrl,
		toAbsoluteUrl,
		plugins: parseCommentContentPlugins
	})
	// Split content into paragraphs on multiple line breaks,
	// trim whitespace around paragraphs.
	if (content) {
		// Split content into multiple paragraphs on multiple line breaks.
		content = splitParagraphs(content)
		// Trim whitespace around paragraphs.
		content = trimContent(content)
	}
	if (content) {
		postProcessCommentContent(content, {
			// `comment` is only used by `expandStandaloneAttachmentLinks()`.
			comment,
			boardId,
			threadId,
			messages,
			commentUrl
		})
	}
	return content
}