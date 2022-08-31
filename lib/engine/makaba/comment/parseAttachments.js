import parseAttachment from './parseAttachment.js'

export default function parseAttachments(post, { transformAttachmentUrl, toAbsoluteUrl }) {
	// `post.files` is gonna be `null` instead of `[]`
	// in the data returned from "get threads list page" API:
	// * `https://2ch.hk/a/index.json`
	// * `https://2ch.hk/a/1.json`
	// * `https://2ch.hk/a/2.json`
	// * ...
	if (post.files === null) {
		return
	}
	if (post.files.length > 0) {
		return post.files.map((file) => {
			return parseAttachment(file, { transformAttachmentUrl, toAbsoluteUrl })
		})
	}
}