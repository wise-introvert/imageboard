export default function getBoardInfo(response) {
	const board = {
		title: response.name,
		defaultAuthorName: response.default_name,
		bumpLimit: response.bump_limit,
		maxCommentLength: response.max_comment,
		maxAttachmentsSize: response.max_files_size,
		areSubjectsAllowed: response.enable_subject,
		// It's not clear whether `file_types` property always exists or not.
		areAttachmentsAllowed: response.file_types !== undefined && response.file_types.filter(_ => _ !== 'youtube').length > 0,
		areTagsAllowed: response.enable_thread_tags,
		hasVoting: response.enable_likes,
		hasFlags: response.enable_flags
	}
	if (response.enable_icons && response.icons) {
		board.badges = response.icons.map(({ name, num }) => ({ id: num, title: name }))
	}
	return board
}