import getBoardInfo from '../board/getBoardInfo.js'
import parseThread from './parseThread.js'

/**
 * Parses "get threads list" page API response.
 * @param  {object} response — "get threads list" page API response.
 * @return {object} `{ pageCount, board, threads }`.
 */
export default function parseThreadsPageResponse(response) {
	return {
		// page: response.current_page + 1,
		pageCount: response.pages.length,
		board: getBoardInfo(response.board),
		threads: response.threads.map((thread) => {
			const _thread = parseThread(thread.posts[0], thread)
			_thread.comments = _thread.comments.concat(thread.posts.slice(1))
			return _thread
		})
	}
}