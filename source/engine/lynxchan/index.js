import Engine from '../../Engine'

import parseBoardsResponse from './board/parseBoardsResponse'
import parseThreadsResponse from './thread/parseThreadsResponse'
import parseThreadsPageResponse from './thread/parseThreadsPageResponse'
import parseThreadResponse from './thread/parseThreadResponse'
import parseComment from './comment/parseComment'

import Board from '../../Board'
import Thread from '../../Thread'
import Comment from '../../Comment'

import PARSE_COMMENT_CONTENT_PLUGINS from './comment/parseCommentContentPlugins'
import KOHLCHAN_PARSE_COMMENT_CONTENT_PLUGINS from './comment/parseCommentContentPlugins.kohlchan'

export default class LynxChan extends Engine {
	constructor(chanSettings, options) {
		super(chanSettings, {
			...options,
			parseCommentContentPlugins: getParseCommentContentPlugins(chanSettings.id)
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
		const { threads } = parseThreadsResponse(response)
		return threads.map(thread => this.createThreadObject(thread, options))
	}

	/**
	 * Parses "get threads list" page API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread[]}
	 */
	parseThreadsPage(response, options) {
		const { board, threads } = parseThreadsPageResponse(response)
		return threads.map((thread) => this.createThreadObject(thread, options, { board }))
	}

	/**
	 * Parses "get thread comments" API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread}
	 */
	parseThread(response, options) {
		const { board, thread } = parseThreadResponse(response)
		return this.createThreadObject(thread, options, { board })
	}

	/**
	 * Parses comment data.
	 * @param  {object} comment
	 * @param  {object} options
	 * @param  {object} parameters.thread
	 * @return {object}
	 */
	_parseComment(comment, options, { thread }) {
		return parseComment(comment, options, { thread })
	}
}

function getParseCommentContentPlugins(chan) {
	switch (chan) {
		case 'kohlchan':
			return KOHLCHAN_PARSE_COMMENT_CONTENT_PLUGINS
		default:
			return PARSE_COMMENT_CONTENT_PLUGINS
	}
}