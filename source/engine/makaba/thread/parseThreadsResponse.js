import getBoardInfo from '../board/getBoardInfo'
import parseThread from './parseThread'

/**
 * Parses "get threads list" API response.
 * @param  {object} response — "get threads list" API response.
 * @return {object} `{ board, threads }`.
 */
export default function parseThreadsResponse(response) {
	return {
		board: getBoardInfo(response),
		threads: response.threads.map(thread => parseThread(thread, thread))
	}
}