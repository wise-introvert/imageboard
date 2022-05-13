import parseThread from './parseThread.js'

/**
 * Parses "get thread comments" API response.
 * @param  {object} response — "get thread comments" API response.
 * @return {object} `{ thread }`
 */
export default function parseThreadResponse(response) {
	const thread = parseThread(response.posts[0])
	thread.comments = thread.comments.concat(response.posts.slice(1))
	return {
		thread
	}
}