export default function getBoardInfo(board) {
	const parsedBoard = {
		title: board.name,
		defaultAuthorName: board.default_name,
		bumpLimit: board.bump_limit,
		maxCommentLength: board.max_comment,
		maxAttachmentsSize: board.max_files_size,
		areSubjectsAllowed: board.enable_subject,
		// It's not clear whether `file_types` property always exists or not.
		areAttachmentsAllowed: board.file_types !== undefined && board.file_types.filter(_ => _ !== 'youtube').length > 0,
		areTagsAllowed: board.enable_thread_tags,
		hasVoting: board.enable_likes,
		hasFlags: board.enable_flags
	}
	if (board.enable_icons && board.icons) {
		parsedBoard.badges = board.icons.map(({ name, num }) => ({ id: num, title: name }))
	}
	return parsedBoard
}