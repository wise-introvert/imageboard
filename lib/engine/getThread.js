import convertDateToUtc0 from '../utility/convertDateToUtc0.js'
import joinPath from '../utility/joinPath.js'

/**
 * Performs a "get thread comments" API query and parses the response.
 * @param  {object} engineTools — API URLs and configuration parameters, `request()` function, `parseThread()` function, etc.
 * @param  {object} parameters — `{ boardId, threadId }`.
 * @param  {object} [options] — See the README.
 * @return {Promise<object>} — A `Thread` object.
 */
export default function getThread({
	api,
	request,
	engine,
	parseThread
}, parameters, options) {
	// Returns a `Promise`.
	const getThread = () => {
		return request(api.getThread, {
			urlParameters: parameters
		}).then((response) => {
			return {
				response
			}
		})
	}

	// Returns a `Promise`.
	const getArchivedThread = () => {
		return request(api.getArchivedThread, {
			urlParameters: parameters
		}).then((response) => {
			return {
				isArchived: true,
				response
			}
		})
	}

	// `makaba` requires some hacky workarounds in order to determine
	// when a thread has been archived.
	// Returns a `Promise`.
	const getThreadFromArchiveMakaba = () => {
		return request(api.getArchivedThread, {
			urlParameters: parameters,
			returnResponseInfoObject: true
		}).then(
			({ response, url }) => {
				let archivedAt
				let archivedDateString
				// Extract `archivedAt` date from the "final" URL (after redirect).
				const archivedDateMatch = url.match(/\/arch\/(\d{4}-\d{2}-\d{2})\/res\//)
				if (archivedDateMatch) {
					archivedDateString = archivedDateMatch[1]
					const [year, month, day] = archivedDateString.split('-')
					archivedAt = convertDateToUtc0(new Date(year, month - 1, day))
				}
				return {
					response,
					isArchived: true,
					archivedAt,
					archivedDateString
				}
			}
		)
	}

	// Tries to load the thread from the archive.
	// Returns a `Promise`.
	const getThreadFromArchive = () => {
		if (engine === 'makaba') {
			return getThreadFromArchiveMakaba()
		}
		if (api.getArchivedThread) {
			return getArchivedThread()
		}
		return getThread()
	}

	// Returns a `Promise`.
	const fetchThread = () => {
		// If a thread is known to be archived then fetch it from the archive.
		if (options && options.isArchived) {
			return getThreadFromArchive()
		}
		return getThread().catch((error) => {
			// `makaba` requires some hacky workarounds in order to
			// determine if a thread is archived.
			if (error.status === 404) {
				// Try to load the thread from the archive.
				return getThreadFromArchive()
			}
			throw error
		})
	}

	return fetchThread().then(
		({
			response,
			isArchived,
			archivedAt,
			archivedDateString
		}) => {
			const getMakabaOptions = () => {
				// For ancient `2ch.hk` (engine: "makaba") threads archived
				// between March 6th, 2016 and November 12th, 2016,
				// transform relative attachment URLs to absolute ones.
				// (`file_prefix` is "../" for those)
				if (isArchived && engine === 'makaba' && response.file_prefix) {
					return {
						transformAttachmentUrl(url) {
							return joinPath(`/${response.Board}/arch/${archivedDateString}/res`, response.file_prefix, url)
						}
					}
				}
			}

			// Parse the thread comments list.
			// `boardId` and `threadId` are still used there.
			const thread = parseThread(response, {
				...parameters,
				...options,
				...getMakabaOptions()
			})

			if (isArchived) {
				thread.isArchived = true
				thread.isLocked = true
				thread.archivedAt = archivedAt
			}

			return thread
		}
	)
}