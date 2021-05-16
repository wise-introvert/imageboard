import Engine from '../../Engine'

import parseBoardsResponse from './board/parseBoardsResponse'
import parseThreadsResponse from './thread/parseThreadsResponse'
import parseThreadsPageResponse from './thread/parseThreadsPageResponse'
import parseThreadResponse from './thread/parseThreadResponse'
import parseComment from './comment/parseComment'
import parsePostResponse from './post/parsePostResponse'
import parseReportResponse from './report/parseReportResponse'

import Board from '../../Board'
import Thread from '../../Thread'
import Comment from '../../Comment'

import PARSE_COMMENT_CONTENT_PLUGINS from './comment/parseCommentContentPlugins.4chan'
import EIGHT_CHAN_PARSE_COMMENT_CONTENT_PLUGINS from './comment/parseCommentContentPlugins.8ch'
import LAIN_CHAN_PARSE_COMMENT_CONTENT_PLUGINS from './comment/parseCommentContentPlugins.lainchan'
import ARISU_CHAN_PARSE_COMMENT_CONTENT_PLUGINS from './comment/parseCommentContentPlugins.arisuchan'

export default class FourChan extends Engine {
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
		return parseBoardsResponse(response, this.getOptions(options)).map(Board)
	}

	/**
	 * Parses "get threads list" API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread[]}
	 */
	parseThreads(response, options) {
		const { threads } = parseThreadsResponse(response, options)
		return threads.map(thread => this.createThreadObject(thread, options))
	}

	/**
	 * Parses "get threads list" page API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread[]}
	 */
	parseThreadsPage(response, options) {
		const { threads } = parseThreadsPageResponse(response)
		return threads.map(thread => this.createThreadObject(thread, options))
	}

	/**
	 * Parses "get thread comments" API response.
	 * @param  {any} response
	 * @param  {object} [options]
	 * @return {Thread}
	 */
	parseThread(response, options) {
		const { thread } = parseThreadResponse(response)
		// Fix incorrect attachments count for certain engines.
		//
		// `8ch.net` returns incorrect `images` count:
		// for example, a thread having `6` replies and `3` images
		// (one image being part of the "opening post")
		// `replies` is `6` (correct) but `images` and `omitted_images` are both `1`.
		// https://github.com/OpenIB/OpenIB/issues/295
		//
		// Or, in `/catalog.json`, it can sometimes be as weird as:
		// {
		// 	"omitted_posts": 249,
		// 	"omitted_images": 250,
		// 	"replies": 250,
		// 	"images": 1,
		// }
		//
		// Therefore, attachments are counted "by hand" in case of `8ch.net` (OpenIB).
		//
		// `vichan` also has the same bug:
		// https://github.com/vichan-devel/vichan/issues/327
		//
		// Also, `vichan` and `OpenIB` don't have `replies` property
		// in "get thread comments" API response.
		//
		if (this.options.engine === 'OpenIB' || this.options.engine === 'vichan') {
			if (thread.commentsCount === undefined) {
				thread.commentsCount = thread.comments.length
			}
			thread.attachmentsCount = thread.comments.reduce(
				(sum, comment) => sum += comment.attachments ? comment.attachments.length : 0,
				0
			)
		}
		return this.createThreadObject(thread)
	}

	/**
	 * Parses comment data.
	 * @param  {object} comment
	 * @param  {object} options
	 * @return {object}
	 */
	_parseComment(comment, options) {
		return parseComment(comment, options)
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

function getParseCommentContentPlugins(chan) {
	switch (chan) {
		case '8ch':
			return EIGHT_CHAN_PARSE_COMMENT_CONTENT_PLUGINS
		case 'lainchan':
			return LAIN_CHAN_PARSE_COMMENT_CONTENT_PLUGINS
		case 'arisuchan':
			return ARISU_CHAN_PARSE_COMMENT_CONTENT_PLUGINS
		default:
			return PARSE_COMMENT_CONTENT_PLUGINS
	}
}