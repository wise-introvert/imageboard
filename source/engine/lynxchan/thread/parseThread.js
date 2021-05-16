/**
 * Parses chan API response for a thread.
 * @param  {object} response — Chan API response for a thread
 * @param  {object} options
 * @return {object} See README.md for "Thread" object description.
 */
export default function parseThread({
	threadId,
	locked,
	pinned,
	cyclic,
	archived,
	autoSage,
	lastBump,
	maxFileCount,
	maxMessageLength,
	postCount,
	fileCount,
	posts,
	files,
	ommitedPosts,
	...rest
}, {
	mode
}) {
	const thread = {
		id: threadId,
		isLocked: locked,
		isSticky: pinned,
		isRolling: cyclic,
		commentsCount: getCommentsCount(postCount, posts, ommitedPosts, mode),
		attachmentsCount: getAttachmentsCount(fileCount, posts, files, mode)
	}
	// LynxChan allows manually archiving a thread by an admin or a moderator.
	if (archived) {
		thread.isArchived = true
		// LynxChan doesn't provide an `archivedAt` date.
	}
	// `autoSage: true` can be set on a "sticky" thread for example.
	if (autoSage) {
		thread.isBumpLimitReached = true
	}
	// `lastBump` is only present in `/catalog.json` API response.
	if (lastBump) {
		thread.updatedAt = new Date(lastBump)
	}
	thread.comments = [{
		postId: threadId,
		files,
		...rest
	}]
	if (posts) {
		thread.comments = thread.comments.concat(posts)
	}
	return thread
}

function getCommentsCount(postCount, posts, ommitedPosts, mode) {
	// `lynxchan` doesn't provide `postCount` in "get thread" API response.
	// In `/catalog.json` reponse `posts` property is always non-present,
	// while in "get thread" API response it seems to always be present:
	// even when there're no replies, `posts` is `[]`.
	if (mode === 'thread') {
		return posts.length + 1
	}
	// If `ommitedPosts` property is present then it's a threads list page.
	// `ommitedPosts` property is incorrectly named.
	// https://gitgud.io/LynxChan/LynxChan/-/issues/53
	if (ommitedPosts !== undefined) {
		return ommitedPosts + 1 + posts.length
	}
	// Uses a workaround for a `lynxchan` bug:
	// `lynxchan` doesn't return `postCount`
	// in `/catalog.json` API response
	// when there're no replies in a thread.
	//
	// There's no such bug on `kohlchan.net` though,
	// because they patch those types of bugs themselves
	// on top of the original `lynxchan` code.
	//
	return (postCount || 0) + 1
}

function getAttachmentsCount(fileCount, posts, files, mode) {
	// `lynxchan` doesn't provide `fileCount` in "get thread" API response.
	// In `/catalog.json` reponse `posts` property is always non-present,
	// while in "get thread" API response it seems to always be present:
	// even when there're no replies, `posts` is `[]`.
	if (mode === 'thread') {
		return files.length + posts.reduce((sum, post) => sum + post.files.length, 0)
	}

	// There's no `ommitedFiles` property.
	// https://gitgud.io/LynxChan/LynxChan/-/issues/53
	// // If `ommitedFiles` property is present then it's a threads list page.
	// // `ommitedFiles` property is incorrectly named.
	// // https://gitgud.io/LynxChan/LynxChan/-/issues/53
	// if (ommitedFiles !== undefined) {
	// 	return ommitedFiles + files.length + posts.reduce((sum, post) => sum + post.files.length, 0)
	// }

	// On threads list page, there's no `fileCount` property at all,
	// so the attachments count is unknown.
	// Just return 0.
	if (mode === 'threads-page') {
		return 0
	}

	// There could be any number of attachments on the "opening comment":
	// `lynxchan` doesn't provide that info in "/catalog.json" API response.
	// The guess is `1`.
	//
	// On `kohlchan.net`, they provide the `files` array
	// in `/catalog.json` API response.
	// That's because they patch `lynxchan` themselves
	// and fix such types of bugs.
	//
	const mainCommentAttachmentsCount = files ? files.length : 1

	// Uses a workaround for a `lynxchan` bug:
	// `lynxchan` doesn't return `fileCount`
	// in `/catalog.json` API response
	// when there're no replies in a thread.
	//
	// There's no such bug on `kohlchan.net` though,
	// because they patch those types of bugs themselves
	// on top of the original `lynxchan` code.
	//
	// `fileCount` doesn't include the "opening comment"'s attachments.
	//
	return (fileCount || 0) + mainCommentAttachmentsCount
}