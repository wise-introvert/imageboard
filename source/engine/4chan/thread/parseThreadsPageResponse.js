import parseThread from './parseThread'

/**
 * Parses "get threads list" page API response.
 * @param  {object} response — "get threads list" page API response.
 * @return {object} `{ threads }`
 */
export default function parseThreadsPageResponse(response) {
	return {
		threads: response.threads.map((thread) => {
			const _thread = parseThread(thread.posts[0])
			_thread.comments = _thread.comments.concat(thread.posts.slice(1))
			return _thread
		})
	}
}