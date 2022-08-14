export default function parseThread({
	num,
	files,
	closed,
	sticky,
	endless,
	lasthit,
	tags,
	...rest
}, {
	posts_count,
	files_count,
	unique_posters
}) {
	// `num` is a string in `/catalog.json` API response.
	// `num` is a string also in `/threads.json` API response.
	if (typeof num === 'string') {
		num = parseInt(num)
	}
	const thread = {
		id: num,
		commentsCount: posts_count + 1,
		// `files_count` doesn't include the "opening comment"'s attachments in this case.
		// `files_count` is incorrect anyway:
		// https://gitlab.com/catamphetamine/imageboard/blob/master/docs/engines/makaba-issues.md
		attachmentsCount: files_count + files.length,
		updatedAt: new Date(lasthit * 1000)
	}
	if (unique_posters !== undefined) {
		// `unique_posters` is only present in "get thread comments" API response.
		// For some weird reason doesn't include the "opening comment" of a thread.
		// In other words, `unique_posters` won't count thread author unless
		// they've posted a comment in their own thread.
		thread.uniquePostersCount = parseInt(unique_posters)
	}
	if (closed === 1) {
		thread.isLocked = true
	}
	// If the thread is pinned `sticky` will be a number greater than `0`.
	if (sticky > 0) {
		thread.isSticky = true
	}
	// "Rolling" threads never go into "bump limit":
	// instead messages are being shifted from the start of
	// such thread as new messages are posted to it.
	// The "opening post" is always preserved.
	if (endless === 1) {
		thread.isRolling = true
	}
	// `tags` seems to be a single tag name. Example: "fighting".
	// Tags are present, for example, on `/vg/` board.
	// If there're no tags then `tags` is an empty string.
	if (tags) {
		thread.tags = [tags]
	}
	thread.comments = [{
		num,
		files,
		...rest
	}]
	return thread
}