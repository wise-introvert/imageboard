import parseAttachment from './parseAttachment.js'

export default function parseAttachments(post, { transformAttachmentUrl, toAbsoluteUrl }) {
	if (post.files.length > 0) {
		return post.files.map((file) => {
			return parseAttachment(file, { transformAttachmentUrl, toAbsoluteUrl })
		})
	}
}