/**
 * Parses chan API response for a thread.
 * @param  {object} response — Chan API response for a thread
 * @param  {object} options
 * @return {object} See README.md for "Thread" object description.
 */
export default function parseThread({
	no,
	replies,
	images,
	// Attachment file extension.
	ext,
	// In case of more than a single attachment (8ch, vichan).
	extra_files,
	last_replies,
	omitted_images,
	closed,
	locked,
	sticky,
	cyclical,
	unique_ips,
	last_modified,
	bumplocked,
	bumplimit,
	imagelimit,
	archived,
	archived_on,
	custom_spoiler
}) {
	const thread = {
		// `no` is present in "get threads list" API response.
		id: no,
		isSticky: sticky,
		//
		// `4chan.org` has `closed` property.
		// `8ch.net` has `locked` property.
		isLocked: closed || locked,
		//
		// `8ch.net` has `cyclical="0"` property.
		// I guess it's for "rolling" threads.
		// Seems that it's always "0" though.
		// Weird that it's a string rather than a number
		// like it is for `sticky` or `locked`.
		isRolling: cyclical === '1',
		//
		// `4chan`, `OpenIB` and `vichan` have `replies` property.
		// `vichan` has `replies` property
		// in "get threads list on a board" API response,
		// but not in "get thread comments" API response.
		// If `replies` property is present, use it to calculate `commentsCount`.
		commentsCount: replies === undefined ? undefined : replies + 1,
		//
		// `4chan`, `OpenIB` and `vichan` have `images` property.
		// `vichan` has `images` property
		// in "get threads list on a board" API response,
		// but not in "get thread comments" API response.
		// If `images` property is present, use it to calculate `attachmentsCount`.
		//
		// The `images` property doesn't include the attachments
		// of the "opening comment". Therefore, the count of attachments
		// of the "opening comment" should be added.
		// On `4chan.org`, there can only be a single attachment in a comment.
		// `vichan` and `OpenIB` support several attachments in a comment.
		//
		attachmentsCount: getAttachmentsCount({
			images,
			omitted_images,
			ext,
			extra_files,
			cyclical
		})
	}
	// Is present only in "get thread comments" API response.
	if (unique_ips) {
		// Includes both comment posters and the thread poster.
		thread.uniquePostersCount = unique_ips
	}
	// Is present only in "get threads list" API response.
	if (last_modified) {
		thread.updatedAt = new Date(last_modified * 1000)
	}
	// `8ch.net` has a concept of "bumplocked" threads that are in "autosage" mode.
	// https://twitter.com/infinitechan/status/555013038839848961
	// In other words, "bumplocked" threads are never bumped.
	// I guess it can be set both when a thread is created and later too.
	// Weird that it's a string rather than a number
	// like it is for `sticky` or `locked`.
	if (bumplocked === '1') {
		thread.isBumpLimitReached = true
	}
	// On `8ch.net` threads are marked as `bumplimit: 1` when
	// their technical "bump limit" is technically "reached".
	if (bumplimit === 1) {
		thread.isBumpLimitReached = true
	}
	if (imagelimit === 1) {
		thread.isAttachmentLimitReached = true
	}
	if (archived === 1) {
		thread.isArchived = true
		if (archived_on) {
			thread.archivedAt = new Date(archived_on * 1000)
		}
	}
	// At `4chan.org` each board can have a list of "custom spoilers" for attachments.
	// `custom_spoiler` is a number, and if it's `5`, for example, then it means that
	// the board has five custom spoilers defined: from `1` to `5`.
	// One can then choose any one of the available custom spoiler ids.
	// Custom spoiler URLs are: https://s.4cdn.org/image/spoiler-{boardId}{customSpoilerId}.png
	// Every time a new post is added to a thread the chosen custom spoiler id is rotated.
	// https://github.com/4chan/4chan-API
	if (custom_spoiler) {
		thread.customSpoilersCount = custom_spoiler
	}
	return thread
}

function getAttachmentsCount({
	images,
	omitted_images,
	ext,
	extra_files,
	cyclical
}) {
	// `4chan` doesn't have `cyclical` property.
	if (!cyclical) {
		return images
	}
	// `8ch` (`OpenIB`) and `vichan` have incorrect `images` property.
	// `vichan` has `images` property in "/catalog.json" API response,
	// which is incorrect, and doesn't have that property in
	// "get thread comments" API response.
	// `OpenIB` has `images` property both in "/catalog.json" API response
	// and in "get thread comments" API response, but that `images` property
	// is also incorrect, so it should be ignored.
	return omitted_images + (ext ? 1 + (extra_files ? extra_files.length : 0) : 0)
}