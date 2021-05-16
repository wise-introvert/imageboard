import Engine from '../../Engine'

import parseBoardsResponse from './board/parseBoardsResponse'
import parseThreadsResponse from './thread/parseThreadsResponse'
import parseThreadsPageResponse from './thread/parseThreadsPageResponse'
import parseThreadResponse from './thread/parseThreadResponse'
import parseComment from './comment/parseComment'
import parseVoteResponse from './vote/parseVoteResponse'
import parsePostResponse from './post/parsePostResponse'
import parseReportResponse from './report/parseReportResponse'

import Board from '../../Board'
import Thread from '../../Thread'
import Comment from '../../Comment'

import PARSE_COMMENT_CONTENT_PLUGINS from './comment/parseCommentContentPlugins'

export default class Makaba extends Engine {
	constructor(chanSettings, options) {
		super(chanSettings, {
			...options,
			parseCommentContentPlugins: PARSE_COMMENT_CONTENT_PLUGINS
		})
	}

	/**
	 * Parses "get boards list" API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Board[]}
	 */
	parseBoards(response, options) {
		return parseBoardsResponse(response, options).map(Board)
	}

	/**
	 * Parses "get threads list" API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread[]}
	 */
	parseThreads(response, options) {
		const { board, threads } = parseThreadsResponse(response)
		return threads.map(thread => this.createThreadObject(thread, options, { board }))
	}

	/**
	 * Parses "get threads list" page API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread[]}
	 */
	parseThreadsPage(response, options) {
		const { board, threads } = parseThreadsPageResponse(response)
		return threads.map(thread => this.createThreadObject(thread, options, { board }))
	}

	/**
	 * Parses "get thread comments" API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread}
	 */
	parseThread(response, options) {
		const { thread, board } = parseThreadResponse(response)
		// Fix incorrect attachments count.
		// https://gitlab.com/catamphetamine/imageboard/blob/master/docs/engines/makaba-issues.md
		thread.attachmentsCount = thread.comments.reduce((sum, comment) => sum += comment.files.length, 0)
		return this.createThreadObject(thread, options, { board })
	}

	/**
	 * Parses comment data.
	 * @param  {object} comment
	 * @param  {object} options
	 * @param  {object} parameters.board
	 * @return {object}
	 */
	_parseComment(comment, options, { board }) {
		return parseComment(comment, options, { board })
	}

	/**
	 * Parses "vote" API response.
	 * @param  {object} response
	 * @return {boolean} Returns `true` if the vote has been accepted.
	 */
	parseVoteResponse(response) {
		return parseVoteResponse(response)
	}

	/**
	 * Parses "post" API response.
	 * @param  {object} response
	 * @return {number} Returns new thread ID or new comment ID.
	 */
	parsePostResponse(response) {
		return parsePostResponse(response)
	}

	/**
	 * Parses "report" API response.
	 * @param  {object} response
	 */
	parseReportResponse(response) {
		return parseReportResponse(response)
	}
}