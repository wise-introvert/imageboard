import getBoardInfo from '../board/getBoardInfo.js'
import parseThread from './parseThread.js'

/**
 * Parses "get thread comments" API response.
 * @param  {object} response — "get thread comments" API response.
 * @return {object} `{ board, thread }`.
 */
export default function parseThreadResponse(response) {
	const comments = response.threads[0].posts
	const thread = parseThread(comments[0], response)
	thread.comments = comments
	return {
		board: getBoardInfo(response),
		thread
	}
}