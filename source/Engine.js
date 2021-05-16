import parseAndFormatCommentContent from './parseAndFormatCommentContent'

import Thread from './Thread'
import Comment from './Comment'

import convertDateToUtc0 from './utility/convertDateToUtc0'
import joinPath from './utility/joinPath'
import { getParameters, setParameters, addQueryParameters } from './utility/parameters'

export default class Engine {
	constructor(chanSettings, {
		useRelativeUrls,
		request,
		...rest
	}) {
		const {
			id,
			domain,
			commentUrl: commentUrlParseTemplate,
			...restChanSettings
		} = chanSettings
		if (!useRelativeUrls) {
			this._baseUrl = `https://${domain}`
		}
		this.request = (method, url, options, { returnResponseInfoObject } = {}) => {
			return request(method, url, options).then((response) => {
				// Some engines (like `makaba`) redirect to a different URL
				// when requesting threads that have been archived.
				// For example, a request to `https://2ch.hk/b/arch/res/119034529.json`
				// redirects to `https://2ch.hk/b/arch/2016-03-06/res/119034529.json`.
				// From that "final" URL, one can get the `archivedAt` date of the thread.
				// For that reason, the application can (optionally) choose to return
				// not simply a `string` from the `request()`'s `Promise`, but instead
				// an `object` having `response: string` and `url: string`.
				// For example, `captchan` uses this undocumented feature
				// in order to get `archivedAt` timestamps on `2ch.hk`.
				if (typeof response === 'object') {
					url = response.url
					response = response.response
				}
				switch (options.headers['Accept']) {
					case 'application/json':
						try {
							response = JSON.parse(response)
						} catch (error) {
							// Sometimes imageboards may go offline while still responding with a web page:
							// an incorrect 2xx HTTP status code with HTML content like "We're temporarily offline".
							// Accepting only `application/json` HTTP responses works around that.
							console.error(`An HTTP request to ${url} returned an invalid JSON:`)
							console.error(response)
							throw new Error('INVALID_RESPONSE')
						}
						break
				}
				if (returnResponseInfoObject) {
					return {
						response,
						url
					}
				}
				return response
			})
		}
		this.options = {
			chan: id,
			toAbsoluteUrl: this.toAbsoluteUrl,
			commentUrl: '/{boardId}/{threadId}#{commentId}',
			parseCommentContent: this.parseCommentContent,
			...restChanSettings,
			...rest
		}
		// Compile `commentUrl` template into a parsing regular expression.
		if (commentUrlParseTemplate) {
			this.options.commentUrlParser = new RegExp(
				'^' +
				commentUrlParseTemplate
					// Escape slashes.
					.replace(/\//g, '\\/')
					// The "?" at the end of the `boardId` "capturing group"
					// means "non-greedy" regular expression matching.
					// (in other words, it means "stop at the first slash").
					// (could be written as "([^\\/]+)" instead).
					.replace('{boardId}', '(.+?)')
					.replace('{threadId}', '(\\d+)')
					.replace('{commentId}', '(\\d+)') +
				'$'
			)
		}
	}

	getOptions(options) {
		return {
			...this.options,
			...options
		}
	}

	toAbsoluteUrl = (url) => {
		// Convert relative URLs to absolute ones.
		if (this._baseUrl) {
			if (url[0] === '/' && url[1] !== '/') {
				return this._baseUrl + url
			}
		}
		return url
	}

	/**
	 * Performs a "get boards list" API query and parses the response.
	 * @param  {object} [options] — See the README.
	 * @return {object[]} — A list of `Board` objects.
	 */
	async getBoards(options = {}) {
		// Some "legacy" chans don't provide `/boards.json` API
		// so their boards list is defined as a static one in JSON configuration.
		if (this.options.boards) {
			return this.options.boards
		}

		const { boardCategories } = this.options

		// Get the API endpoint URL.

		const {
			getAllBoards,
			getBoards,
			getBoardsPage
		} = this.options.api

		let url
		let page

		if (options.all) {
			if (getAllBoards) {
				url = getAllBoards
			} else if (getBoardsPage) {
				url = getBoardsPage
				page = 1
			}
		} else {
			if (getBoards) {
				url = getBoards
			} else if (getBoardsPage) {
				url = getBoardsPage
				page = 1
			}
		}

		// Validate URL.
		if (!url) {
			throw new Error('Couldn\'t determine the boards list URL')
		}

		// Query the API.
		const fetch = async (url) => {
			return await this.request('GET', this.toAbsoluteUrl(url), {
				headers: {
					'Accept': 'application/json'
				}
			})
		}

		// If no pagination is used, return the list of boards.
		if (!page) {
			const response = await fetch(url)
			return this.parseBoards(response, options)
		}

		// Iterate through boards list pages.
		let response = await fetch(url.replace('{page}', page))
		let { boards, pageCount } = this.parseBoardsPage(response, options)
		while (page < pageCount) {
			page++
			response = await fetch(url.replace('{page}', page))
			const { boards: nextBoards } = this.parseBoardsPage(response, options)
			boards = boards.concat(nextBoards)
		}

		return boards
	}

	/**
	 * Performs a "get all boards list" API query and parses the response.
	 * @param  {object} [options] — See the README.
	 * @return {object[]} — A list of `Board` objects.
	 */
	async getAllBoards(options) {
		return await this.getBoards({
			...options,
			all: true
		})
	}

	/**
	 * A "feature-detection" method.
	 * @return {boolean} Returns `true` if an imageboard engine supports `.findBoards()` method.
	 */
	canSearchForBoards() {
		return false
	}

	/**
	 * Searches for boards matching a query.
	 * @param  {string} query
	 * @return {Board[]}
	 */
	async findBoards(query) {
		// This method isn't currently implemented in any of the supported imageboard engines.
		throw new Error('Not implemented')
	}

	/**
	 * Returns `true` if an imageboard has a "get all boards" API endpoint
	 * that's different from the regular "get boards" API endpoint.
	 * In other words, returns `true` if an imageboard provides separate API
	 * endpoints for getting a list of "most popular boards" and a list of
	 * "all boards available".
	 * @return {boolean}
	 */
	hasMoreBoards() {
		return this.options.api.getAllBoards !== undefined
	}

	/**
	 * Performs a "get threads list" API query and parses the response.
	 * @param  {object} parameters — `{ boardId }`.
	 * @param  {object} [options] — See the README.
	 * @return {object[]} — A list of `Thread` objects.
	 */
	async getThreads(parameters, {
		withLatestComments,
		maxLatestCommentsPages,
		...restOptions
	} = {}) {
		const {
			getThreads: getThreadsUrl,
			getThreadsWithLatestComments: getThreadsWithLatestCommentsUrl,
			getThreadsWithLatestCommentsFirstPage: getThreadsWithLatestCommentsFirstPageUrl,
			getThreadsWithLatestCommentsPage: getThreadsWithLatestCommentsPageUrl
		} = this.options.api

		// The API endpoint URL.
		let url = getThreadsUrl
		let fetchPages
		if (withLatestComments) {
			if (getThreadsWithLatestCommentsUrl) {
				url = getThreadsWithLatestCommentsUrl
			} else if (getThreadsWithLatestCommentsPageUrl) {
				fetchPages = true
			}
		}

		// Fetches data from a URL.
		const fetch = (url) => {
			// Set API endpoint URL parameters (like `{boardId}`).
			url = setParameters(url, parameters)
			return this.request('GET', this.toAbsoluteUrl(url), {
				headers: {
					Accept: 'application/json'
				}
			})
		}

		// Fetch the data from the `/catalog.json` API endpoint.
		const promises = [fetch(url)]

		// Optionally fetch threads list pages.
		if (fetchPages) {
			const maxPagesToFetch = maxLatestCommentsPages === undefined ? MAX_LATEST_COMMENTS_PAGES_TO_FETCH : maxLatestCommentsPages
			let i = 0
			while (i < maxPagesToFetch) {
				let pageUrl = getThreadsWithLatestCommentsPageUrl
					.replace('{pageIndex}', i)
					.replace('{page}', i + 1)
				if (i === 0 && getThreadsWithLatestCommentsFirstPageUrl) {
					pageUrl = getThreadsWithLatestCommentsFirstPageUrl
				}
				promises.push(fetch(pageUrl))
				i++
			}
		}

		// Wait until it fetches the data from `/catalog.json`,
		// along with the optional threads list pages.
		const [response, ...pageResponses] = await Promise.allSettled(promises)

		// If even the `/catalog.json` request didn't succeed, then throw an error.
		if (response.status === 'rejected') {
			throw response.reason
		}

		// Parse the threads list from `/catalog.json` response.
		const fullThreadsList = this.parseThreads(response.value, {
			...parameters,
			...restOptions,
			withLatestComments
		})

		// Parse the optional threads list pages.
		const threadsPages = []
		for (const pageResponse of pageResponses) {
			// As soon as any threads list page returns an error,
			// don't look at further threads list pages.
			// This makes it easy to "overestimate" the possible
			// threads list pages count because it's not known
			// beforehand. Sometimes, it could be known, but only
			// via a separate HTTP query, which would result in
			// additional latency, which is not the best UX.
			if (pageResponse.status === 'rejected') {
				break
			}
			// Parse threads list page.
			const threadsPage = this.parseThreadsPage(pageResponse.value, {
				...parameters,
				...restOptions,
				withLatestComments
			})
			// Add threads list page.
			threadsPages.push(threadsPage)
		}

		// If no threads list pages have been loaded,
		// then simply return the result from `/catalog.json`.
		if (threadsPages.length === 0) {
			return fullThreadsList
		}

		// First page will be treated in a special way
		// compared to the rest of the pages.
		const [firstPage, ...restPages] = threadsPages

		// `firstPage` list will be used for lookup, so don't "mutate" it.
		// The "full threads list" starts from the first threads page.
		const threads = firstPage.slice()

		// For all threads from `/catalog.json` response,
		// add them to the first page of the threads list
		// while skipping duplicates.
		// This way, it's gonna be the same complete list
		// as in case of a `/catalog.json` response, but
		// also with "latest comments" for the first page.
		for (const thread of fullThreadsList) {
			if (!firstPage.find(_ => _.id === thread.id)) {
				threads.push(thread)
			}
		}

		// For all the rest of the pages, for every thread on a page,
		// update its data in the full list of threads.
		// Such thread data has "latest comments", and if any threads
		// aren't present on those pages, they simply won't be updated
		// with their "latest comments" data, and they'll still be present
		// in the full list of threads.
		// The (chronological) order of all threads is preserved.
		for (const threadsPage of restPages) {
			for (const thread of threadsPage) {
				const existingThreadIndex = threads.findIndex(_ => _.id === thread.id)
				if (existingThreadIndex >= 0) {
					threads[existingThreadIndex] = thread
				}
			}
		}

		// Fix `lynxchan` bug when there's no `attachmentsCount` info
		// in threads list page data, so get it from the `/catalog.json` API response.
		if (this.options.engine === 'lynxchan') {
			for (const thread of threads) {
				const threadFromCatalog = fullThreadsList.find(_ => _.id === thread.id)
				thread.attachmentsCount = threadFromCatalog.attachmentsCount
			}
		}

		return threads
	}

	/**
	 * Performs a "get thread comments" API query and parses the response.
	 * @param  {object} parameters — `{ boardId, threadId }`.
	 * @param  {object} [options] — See the README.
	 * @return {object} — A `Thread` object.
	 */
	async getThread(parameters, options) {
		const requestOptions = {
			headers: {
				'Accept': 'application/json'
			}
		}

		let response

		// `makaba` requires some hacky workarounds in order to determine
		// if a thread is archived, and, if it is, when has it been archived.
		let isArchived
		let archivedAt
		let archivedDateString

		const getThread = async () => {
			const url = setParameters(this.options.api.getThread, parameters)
			response = await this.request('GET', this.toAbsoluteUrl(url), requestOptions)
		}

		// Tries to load the thread from the archive.
		const getThreadFromArchive = async () => {
			if (this.options.engine === 'makaba' && this.options.api.getArchivedThread) {
				const url = setParameters(this.options.api.getArchivedThread, parameters)
				const result = await this.request('GET', this.toAbsoluteUrl(url), requestOptions, {
					returnResponseInfoObject: true
				})
				response = result.response
				isArchived = true
				// Extract `archivedAt` date from the "final" URL (after redirect).
				const archivedDateMatch = result.url.match(/\/arch\/(\d{4}-\d{2}-\d{2})\/res\//)
				if (archivedDateMatch) {
					archivedDateString = archivedDateMatch[1]
					const [year, month, day] = archivedDateString.split('-')
					archivedAt = convertDateToUtc0(new Date(year, month - 1, day))
				}
			}
		}

		if (options && options.isArchived) {
			await getThreadFromArchive()
		} else {
			try {
				await getThread()
			} catch (error) {
				if (error.status === 404) {
					// Try to load the thread from the archive.
					try {
						await getThreadFromArchive()
					} catch (error) {
						console.error(error)
					}
				}
				if (!response) {
					throw error
				}
			}
		}

		const getMakabaOptions = () => {
			// For ancient `2ch.hk` (engine: "makaba") threads archived
			// between March 6th, 2016 and November 12th, 2016,
			// transform relative attachment URLs to absolute ones.
			// (`file_prefix` is "../" for those)
			if (isArchived && this.options.engine === 'makaba' && response.file_prefix) {
				return {
					transformAttachmentUrl(url) {
						return joinPath(`/${response.Board}/arch/${archivedDateString}/res`, response.file_prefix, url)
					}
				}
			}
		}

		// Parse the thread comments list.
		// `boardId` and `threadId` are still used there.
		const thread = this.parseThread(response, {
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

	/**
	 * Performs a "vote" API request and parses the response.
	 * @param  {object} parameters — `{ boardId, threadId, commentId, up }`.
	 * @return {boolean} — Returns `true` if the vote has been accepted.  Returns `false` if the user has already voted for this thread or comment.
	 */
	async vote(params) {
		return this.parseVoteResponse(await this.sendRequest(this.options.api.vote, params))
	}

	/**
	 * Performs a "post" API request and parses the response.
	 * @param  {object} parameters — `{ boardId, threadId?, authorName?, authorEmail?, title?, content?, attachments?, attachmentSpoiler?, attachmentFileTag?, isTextOnly?, accessToken?, captchaId?, captchaSolution? }`.
	 * @return {number} Returns new thread ID or new comment ID. Throws an error in case of an error. If the error is "banned" then the error may have properties: `banId`, `banReason`, `banBoardId`, `banEndsAt`.
	 */
	async post(params) {
		return this.parseLogInResponse(await this.sendRequest(this.options.api.post, params))
	}

	/**
	 * Performs a "report" API request and parses the response.
	 * @param  {object} parameters — `{ boardId, commentId, content }`.
	 * @return {void} Throws in case of an error.
	 */
	async report(params) {
		return this.parseLogInResponse(await this.sendRequest(this.options.api.report, params))
	}

	/**
	 * Performs a "log in" API request and parses the response.
	 * @param  {object} parameters — `{ authToken, authTokenPassword }`.
	 * @return {string} Returns an "access token". Throws in case of an error.
	 */
	async logIn(params) {
		return this.parseLogInResponse(await this.sendRequest(this.options.api.logIn, params))
	}

	/**
	 * Performs a "log out" API request and parses the response.
	 * @return {string} Returns an "access token". Throws in case of an error.
	 */
	async logOut() {
		return this.parseLogOutResponse(await this.sendRequest(this.options.api.logOut))
	}

	/**
	 * Sends an HTTP request to the API.
	 * @param  {object} options — Request options (URL, method, etc).
	 * @param  {object} [params] — Request parameters.
	 * @return {(object|string)} [response]
	 */
	async sendRequest(options, params) {
		let {
			url,
			urlParameters,
			method,
			responseType = 'application/json',
			parameters
		} = options
		let contentType
		let body
		// Get the API endpoint URL.
		if (urlParameters) {
			url = setParameters(url, getParameters(urlParameters, params))
		}
		url = this.toAbsoluteUrl(url)
		// Apply parameters.
		if (parameters) {
			if (method === 'GET') {
				url = addQueryParameters(url, getParameters(parameters, params))
			} else {
				body = JSON.stringify(getParameters(parameters, params))
				contentType = 'application/json'
			}
		}
		// Send HTTP request.
		return await this.request(method, url, {
			body,
			headers: {
				'Content-Type': contentType,
				'Accept': responseType
			}
		})
	}

	/**
	 * Creates a Thread object from thread data.
	 * @param  {object} thread
	 * @param  {object} [options]
	 * @param  {object} [parameters.board]
	 * @return {Thread}
	 */
	createThreadObject(thread, options, { board } = {}) {
		thread.comments = thread.comments.map(
			comment => this.parseComment(comment, options, { board, thread })
		)
		return Thread(
			thread,
			this.getOptions(options),
			{ board }
		)
	}

	/**
	 * Creates a `Comment` from comment data.
	 * @param  {object} comment
	 * @param  {object} options
	 * @param  {object} parameters.board
	 * @param  {object} parameters.thread
	 * @return {Comment}
	 */
	parseComment(comment, options, { board, thread } = {}) {
		options = this.getOptions(options)
		return Comment(this._parseComment(comment, options, { board, thread }), options)
	}

	/**
	 * Can be used when `parseContent: false` option is passed.
	 * @param {object} comment
	 * @param {object} [options] — `{ threadId }` if `threadId` isn't already part of `this.options`.
	 */
	parseCommentContent = (comment, options) => {
		// `post-link` parser uses `boardId` and `threadId`
		// for parsing links like `4chan`'s `href="#p265789424"`
		// that're present in "get thread comments" API response.
		if (!options.boardId || !options.threadId) {
			console.error('`boardId` and `threadId` options are required when parsing thread comments.')
		}
		comment.content = parseAndFormatCommentContent(comment.content, {
			comment,
			...this.getOptions(options)
		})
	}
}

function isJson(response) {
	return Array.isArray(response) || typeof response === 'object'
}

const MAX_LATEST_COMMENTS_PAGES_TO_FETCH = 1