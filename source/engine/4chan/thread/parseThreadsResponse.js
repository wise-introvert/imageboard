import parseThread from './parseThread'

/**
 * Parses "get threads list" API response.
 * @param  {object} response — "get threads list" API response.
 * @return {object} `{ threads, comments }`
 */
export default function parseThreadsResponse(response) {
	// `page.threads || []` works around a `8ch.net` issue:
	// When there're no threads on a board, the `catalog.json`
	// doesn't have any `threads` property: `[{"page":0}]`.
	const threads = response.reduce((all, page) => all.concat(page.threads || []), [])
	return {
		threads: threads.map(parseThread),
		comments: threads
	}
}