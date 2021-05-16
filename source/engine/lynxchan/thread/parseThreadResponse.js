import parseThread from './parseThread'
import getBoardInfo from '../board/getBoardInfo'

/**
 * Parses "get thread comments" API response.
 * @param  {object} response — "get thread comments" API response.
 * @return {object} `{ thread, board }`
 */
export default function parseThreadResponse(response) {
	return {
		thread: parseThread(response, { mode: 'thread' }),
		board: getBoardInfo(response)
	}
}