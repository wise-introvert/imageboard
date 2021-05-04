import parseAndFormatCommentContent from './parseAndFormatCommentContent'

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
		// The API endpoint URL.
		const url = options.all ?
			this.options.api.getAllBoards || this.options.api.getBoards :
			this.options.api.getBoards
		// Validate configuration.
		if (!url) {
			throw new Error('Neither "boards" nor "api.getBoards" parameters were found in chan config')
		}
		// Query the API endpoint.
		const response = await this.request('GET', this.toAbsoluteUrl(url), {
			headers: {
				'Accept': 'application/json'
			}
		})
		// Parse the boards list.
		return this.parseBoards(response, options)
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
	async getThreads(parameters, options) {
		// The API endpoint URL.
		const url = setParameters(this.options.api.getThreads, parameters)
		// Query the API endpoint.
		const response = await this.request('GET', this.toAbsoluteUrl(url), {
			headers: {
				'Accept': 'application/json'
			}
		})
		// Parse the threads list.
		// `boardId` is still used there.
		return this.parseThreads(response, {
			...parameters,
			...options
		})
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
