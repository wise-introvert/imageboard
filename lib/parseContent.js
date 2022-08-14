import { canGeneratePostQuoteIgnoringNestedPostQuotes } from 'social-components/utility/post/generatePostQuote.js'

import generatePreview from './generatePreview.js'
import setPostLinkQuotes, { getGeneratePostQuoteOptions } from './setPostLinkQuotes.js'
import classifyPostLinks from './classifyPostLinks.js'
import setPostLinksDefaultText from './setPostLinksDefaultText.js'

/**
 * Generates autogenerated quotes for a `comment`.
 * Also generates a preview (optional).
 * @param {object} comment
 * @param {number} options.threadId
 * @param {function} options.getCommentById
 * @param {object} [options.messages]
 * @param {number} [options.generatedQuoteMaxLength]
 * @param {number} [options.generatedQuoteMinFitFactor]
 * @param {number} [options.generatedQuoteMaxFitFactor]
 * @param {number} [options.generatedQuoteNewLineCharacterLength]
 * @param {number} options.commentLengthLimit
 * @return {boolean} [contentDidChange] Returns `true` if `comment`'s content has changed.
 */
export function generatePostLinksAndUpdatePreview(comment, {
	threadId,
	getCommentById,
	markDeletedPosts,
	messages,
	generatedQuoteMaxLength,
	generatedQuoteMinFitFactor,
	generatedQuoteMaxFitFactor,
	generatedQuoteNewLineCharacterLength,
	commentLengthLimit,
	minimizeGeneratedPostLinkBlockQuotes,
	hasBeenCalledBefore,
	_isTriggeredByParentCommentContentChange
}) {
	const content = comment.content
	let contentDidChange
	if (!hasBeenCalledBefore) {
		// `classifyPostLinks()` must precede `setPostLinkQuotes()`,
		// because it sets `postWasDeleted: true` flags for deleted comments.
		classifyPostLinks(content, { getCommentById, threadId, markDeletedPosts })
		if (messages) {
			// `setPostLinksDefaultText()` must come after `classifyPostLinks()`.
			// Set "Deleted comment" `content` for links to deleted comments.
			// Set "Hidden comment" `content` for links to hidden comments.
			// Set "External comment" `content` for links from other threads.
			// Keep "Comment" `content` for links to other comments.
			// (there seem to be no "other" cases)
			if (setPostLinksDefaultText(content, { messages })) {
				contentDidChange = true
			}
		}
	}
	if (!hasBeenCalledBefore || _isTriggeredByParentCommentContentChange) {
		// Autogenerate "in reply to" quotes.
		if (setPostLinkQuotes(content, {
			getCommentById,
			messages,
			generatedQuoteMaxLength,
			generatedQuoteMinFitFactor,
			generatedQuoteMaxFitFactor,
			generatedQuoteNewLineCharacterLength
		})) {
			contentDidChange = true
		}
	}
	if (!hasBeenCalledBefore || contentDidChange) {
		if (commentLengthLimit) {
			generatePreview(comment, {
				maxLength: commentLengthLimit,
				minimizeGeneratedPostLinkBlockQuotes
			})
		}
	}
	return contentDidChange
}

/**
 * Adds `.parseContent()` function to a `comment`.
 * @param {object} comment
 * @param {string} options.boardId
 * @param {number} options.threadId
 * @param {function} options.getCommentById
 * @param {function} options.parseCommentContent — `.parseCommentContent()` method of an imageboard instance.
 * @param {object} [options.messages]
 * @param {number} [options.generatedQuoteMaxLength]
 * @param {number} [options.generatedQuoteMinFitFactor]
 * @param {number} [options.generatedQuoteMaxFitFactor]
 * @param {number} [options.generatedQuoteNewLineCharacterLength]
 * @param {number} options.commentLengthLimit
 * @param {boolean} [options.expandReplies] — `expandReplies` option of `imageboard` constructor.
 */
export function addParseContent(comment, {
	boardId,
	threadId,
	getCommentById: originalGetCommentById,
	markDeletedPosts,
	messages,
	generatedQuoteMaxLength,
	generatedQuoteMinFitFactor,
	generatedQuoteMaxFitFactor,
	generatedQuoteNewLineCharacterLength,
	minimizeGeneratedPostLinkBlockQuotes,
	commentLengthLimit,
	expandReplies,
	parseCommentContent
}) {
	let hasBeenCalled
	//
	// Add `.onContentChange()` method to `comment`.
	//
	// Custom `getCommentById` can be passed.
	// For example, in cases when an application performs a periodical
	// "auto refresh" of a thread: if a comment gets removed by a moderator,
	// then custom `getCommentById()` function would still find such comment
	// because it would still be accessible from the original thread data.
	//
	addOnContentChange(comment, ({ _isTriggeredByParentCommentContentChange, getCommentById }) => {
		const hasBeenCalledBefore = hasBeenCalled
		hasBeenCalled = true
		// Set "External comment" for links to other threads.
		// Set "Deleted comment" for links to deleted comments.
		// Set "Hidden comment" for links to hidden comments.
		// Autogenerate "in reply to" quotes for links to all other comments.
		return generatePostLinksAndUpdatePreview(comment, {
			getCommentById: getCommentById || originalGetCommentById,
			markDeletedPosts,
			threadId,
			messages,
			generatedQuoteMaxLength,
			generatedQuoteMinFitFactor,
			generatedQuoteMaxFitFactor,
			generatedQuoteNewLineCharacterLength,
			commentLengthLimit,
			minimizeGeneratedPostLinkBlockQuotes,
			hasBeenCalledBefore,
			_isTriggeredByParentCommentContentChange
		})
	}, {
		expandReplies
	})
	// `shouldUpdateReplies` is `undefined` when called from
	// `social-components/utility/post/loadResourceLinks.js`,
	// so `shouldUpdateReplies` is assumed to be `true` by default.
	let shouldUpdateRepliesOnNextParse
	//
	// Add `.parseContent()` method to `comment`.
	//
	// Custom `getCommentById` can be passed.
	// For example, in cases when an application performs a periodical
	// "auto refresh" of a thread: if a comment gets removed by a moderator,
	// then custom `getCommentById()` function would still find such comment
	// because it would still be accessible from the original thread data.
	//
	comment.parseContent = ({ _exhaustive, getCommentById } = {}) => {
		// The `comment` object reference might have changed for some reason
		// (for example, in `anychan` during thread auto-update).
		// If a developer passes `getCommentById()`, then there's a reason for it,
		// and the reason is most likely that comment object references do change.
		// Therefore, it makes sense to also update the current `comment` object
		// reference when this function is called.
		if (getCommentById) {
			comment = getCommentById(comment.id)
		}
		// Suppose there's a descendant comment whose `.parseContent()`
		// was called. That `.parseContent()` would then call `.parseContent()`
		// of all comments it quotes (and then the process repeats, if required).
		// Such "chain" `.parseContent()` calls are a bit different though:
		// the only reason why those calls are made is to have some `.content`
		// of all quoted comments so that the content of those quotes could be autogenerated,
		// and an autogenerated quote of a comment skips the quotes to its
		// "parent" comments if the comment has something besides that in its `.content`.
		// So, normally, a `.parseContent()` call on a comment stops at
		// "partially parsing" its "parent" comments' `.content`, and
		// then those "partially parsed" "parent" comments are used  in
		// autogenerating the quotes to themselves.
		// This results in quicker parsing times and better performance.
		// But, since those "parent" comments' have only been "partially parsed",
		// they should be re-parsed properly when the time comes to display them.
		// For that, `comment.rawContent` property is created on each such "parent"
		// comment, so that the whole parsing process could be restarted from scratch.
		if (comment.rawContent) {
			comment.content = comment.rawContent
			delete comment.rawContent
		}
		if (comment.content) {
			function parseContent() {
				parseCommentContent(comment, {
					boardId,
					threadId
				})
			}
			// Parse "in-reply-to" comments so that post quotes
			// are autogenerated correclty,
			// but only if the cited comment doesn't have anything
			// except for `post-link`s.
			let shouldBeReParsedLater
			if (comment.inReplyTo && expandReplies) {
				let _canGeneratePostQuoteIgnoringNestedPostQuotes
				if (_exhaustive === false) {
					// Backup the non-parsed comment content, so that it could be
					// stored as a `comment.rawContent` property for future re-parsing.
					const rawContent = comment.content
					parseContent()
					// At this stage, it won't autogenerate quotes for "block" `post-link`s
					// not having human-written `content`. Instead, for such `post-link`s,
					// it will just flag them with `_block: true`.
					// The `_block` flag will be used later when
					// `social-components`' `canGeneratePostQuoteIgnoringNestedPostQuotes()`
					// is called on this comment in order to find out
					// whether the "previous" comments quoted by this comment,
					// if there're any, are required to be parsed,
					// in order to autogenerate this comment's quote.
					// For example, there's comment A, that quotes comment B,
					// that, in turn, quotes comment C.
					// In such case, when showing comments starting from C,
					// B.parseContent({ _exhaustive: false }) is called,
					// which marks B's `post-link` to A with `_block: true`,
					// so that `canGeneratePostQuoteIgnoringNestedPostQuotes(B)`
					// could determine if it could skip the "block" `post-link` to A
					// when generating the quote for the `post-link` to B inside C,
					// meaning that it could skip parsing comment A, and only parse
					// comments C and B.
					setPostLinkQuotes(
						comment.content,
						{
							getCommentById: getCommentById || originalGetCommentById,
							messages,
							// These three options aren't used anyway,
							// but they're passed just for code consistency.
							generatedQuoteMaxLength,
							generatedQuoteMinFitFactor,
							generatedQuoteMaxFitFactor,
							generatedQuoteNewLineCharacterLength,
							generateQuotes: false
						}
					)
					if (canGeneratePostQuoteIgnoringNestedPostQuotes(comment, getGeneratePostQuoteOptions({
						messages,
						// `generatedQuoteMaxLength` and `generatedQuote(Min/Max)FitFactor`
						// passed here are the "maximum" ones between block `post-link` quotes
						// and inline `post-link` quotes: `inReplyTo` list currently
						// doesn't specify whether this `post` is a reply with a
						// block `post-link` to the quoted comment, or a reply with an
						// inline `post-link` to the quoted comment.
						// `setPostLinkQuotes()` could add that info to `inReplyTo` list
						// (for example, via something like an `_inReplyToQuoteType` list)
						// but implementing that feature doesn't seem like a necessity:
						// instead, the code here doesn't differentiate between an
						// inline `post-link` and a block `post-link`, simply
						// passing the maximum `maxLength` of the two.
						// Since block `post-link` quotes have larger `maxLength`
						// than inline `post-link` quotes (in `setPostLinkQuotes()`)
						// then it's assumed that `generatedQuoteMaxLength` is the
						// maximum of the two, and their `fitFactor`s are the same.
						generatedQuoteMaxLength,
						generatedQuoteMinFitFactor,
						generatedQuoteMaxFitFactor,
						generatedQuoteNewLineCharacterLength
					}))) {
						_canGeneratePostQuoteIgnoringNestedPostQuotes = true
						// Don't call `.parseContent()` for the comments in the
						// `inReplyTo` comments list for this "non-exhaustive" parse.
						// But since this comment isn't fully "parsed" in a sense that
						// its autogenerated post link quotes haven't been set yet,
						// mark this comment for later "exhaustive" re-parsing.
						shouldBeReParsedLater = true
						// A later "exhaustive" re-parsing of this comment's content
						// won't change the autogenerated quotes in any of the replies,
						// so those replies' `.content` shouldn't be updated when an
						// "exhaustive" `.parseContent()` is performed on this comment later.
						shouldUpdateRepliesOnNextParse = false
						// Store the original (non-parsed) content,
						// so that it could be re-parsed properly later.
						comment.rawContent = rawContent
					} else {
						// Undo parsing `comment.content`:
						// it will be re-parsed after parsing parent comments' content.
						comment.content = rawContent
					}
				}
				if (!_canGeneratePostQuoteIgnoringNestedPostQuotes) {
					// Parse `inReplyTo` comments.
					// Those comments could be half-parsed for now to reduce
					// the overall parsing time for this comment,
					// hence the `_exhaustive: false` flag.
					for (const comment of comment.inReplyTo) {
						if (!comment.hasContentBeenParsed) {
							comment.parseContent({ _exhaustive: false })
						}
					}
					parseContent()
				}
			} else {
				parseContent()
			}
			if (shouldBeReParsedLater) {
				// See the comments above on passing `generateQuotes: false`.
				// Passing `generateBlockQuotes: false` here has a different goal:
				// it simply skips autogenerating quotes for "block" `post-link`s
				// while autogenerating quotes for "inline" `post-link`s.
				// This way, it could skip parsing the whole comment tree,
				// because "inline" `post-link`s are very rare.
				// Such approach wouldn't work in weird edge cases
				// when a person posts a comment that simply quotes some other comment
				// (happens on 4chan), in which case such comment's `content`
				// will be assumed empty when autogenerating its quote
				// in the `content` of its replies. But such cases are ignored
				// because it's not encouraged to write such weird comments,
				// and comment authors should at least input some text (or attach a media).
				//
				// Example (not the edge case):
				//
				// Comment #1235: ">>1234 \n >Hello \n Hi". (not shown)
				// Comment #1236: ">>1235 \n Wassup". (shown)
				//
				// Without `generateBlockQuotes: false` the parsed comment content would be:
				// Comment #1236: ">>««Hello» \n Hi» \n Wassup".
				//
				// With `generateBlockQuotes: false` the parsed comment content would be:
				// Comment #1236: ">>«Hi» \n Wassup".
				//
				setPostLinkQuotes(
					comment.content,
					{
						getCommentById: getCommentById || originalGetCommentById,
						messages,
						generatedQuoteMaxLength,
						generatedQuoteMinFitFactor,
						generatedQuoteMaxFitFactor,
						generatedQuoteNewLineCharacterLength,
						generateBlockQuotes: false
					}
				)
			} else {
				// This flag is checked in `onContentChange()`.
				comment.hasContentBeenParsed = true
				// Update autogenerated quotes in child comments.
				comment.onContentChange({
					shouldUpdateReplies: shouldUpdateRepliesOnNextParse,
					getCommentById
				})
				// `.parseContent()` method is set to a "no op" function
				// instead of `undefined` for convenience.
				// (because it can be called multiple times in `anychan`
				//  being called in `onItemFirstRender()` of `virtual-scroller`)
				comment.parseContent = () => {}
			}
		}
	}
}

/**
 * Adds `onContentChange()` functions to each comment.
 * (`.onContentChange()` is only called from `.parseContent()`).
 * The `onContentChange()` function should be called
 * whenever the comment content is updated (for example,
 * after a link to a YouTube video is parsed and expanded
 * into an embedded attachment). It re-generates comment
 * preview and also if `expandReplies` is `true` it updates
 * the autogenerated quotes in the comment's replies.
 * Returns an array of ids of replies to this comment whose
 * content did change as a result of this comment content's change.
 * For example, when there're replies to this comment having
 * autogenerated quotes those quotes should be re-generated
 * when this comment's content changes.
 * The returned array of updated reply ids is used, for example,
 * in `anychan` application: each of those updated replies is re-rendered.
 * @param {object} comment
 * @param {function} updateAutogeneratedContent
 * @param {boolean} [options.expandReplies] — `expandReplies: true` option of `imageboard`.
 * @return {number[]} [description] Returns an array of ids of replies to this comment whose content did change as a result of this comment content's change.
 */
function addOnContentChange(comment, updateAutogeneratedContent, { expandReplies }) {
	// Add `.onContentChange()` method to `comment`.
	//
	// `_isTriggeredByParentCommentContentChange` is only passed
	// internally when calling `.onContentChange()` for replies recursively.
	// `_isTriggeredByParentCommentContentChange` should not be passed
	// when calling `.onContentChange()` as a public API.
	// Returns the list of child comment ids whose `content`
	// did change as a result of the parent comment content change.
	//
	// Custom `getCommentById` can be passed.
	// For example, in cases when an application performs a periodical
	// "auto refresh" of a thread: if a comment gets removed by a moderator,
	// then custom `getCommentById()` function would still find such comment
	// because it would still be accessible from the original thread data.
	//
	comment.onContentChange = ({
		_isTriggeredByParentCommentContentChange,
		shouldUpdateReplies,
		getCommentById
	} = {}) => {
		const autogeneratedContentDidChange = comment.content &&
			updateAutogeneratedContent({
				_isTriggeredByParentCommentContentChange,
				// If custom `getCommentById()` option is passed,
				// it replaces the default one used in `updateAutogeneratedContent()`.
				getCommentById
			})
		if (_isTriggeredByParentCommentContentChange) {
			if (autogeneratedContentDidChange) {
				// Theoretically there can be cases when a post's content
				// is present is quotes on a deeper nesting level.
				// For example, if a parent post is "Video Title" and a
				// child post is just a quote of the parent post
				// ("> Video Title") and a child-of-a-child comment quotes
				// the child comment ("> > Video Title").
				// Such edge cases are dismissed to keep the code simple
				// so a child-of-a-child comment will be something like
				// "> > (link to youtube.com)" in such case.
				return []
			}
		}
		// The `if` block above is added to capture "recursive" calls
		// to `.onContentChange()` function so that it doesn't recurse
		// into replies of replies for potentially less CPU usage.
		// There're, however, hypothetical edge cases, when replies'
		// content does depend on the content of their parent's parent.
		// And in those hypothetical edge cases it won't autogenerate
		// quotes correctly. For example, if comment #1 content is
		// "Original comment", and comment #2 content is ">>1",
		// and comment #3 content is ">>2", then, when `.parseContent()`
		// is called on comment #1, comment #2 `content` gets updated
		// to "> Original comment", but since it  doesn't recurse into
		// replies' replies, comment #3 `content` won't be updated to
		// something like "> > Original comment", and will just stay ">>1".
		// The solution is: don't allow posting comments without the actual content.
		//
		// The default behavior is to update all replies unless
		// `shouldUpdateReplies: false` option is passed.
		// For example, `anychan` application calls `.onContentChange()` method
		// when `social-components`'s `loadResourceLinks()` loads any "resource" links
		// (like links to YouTube videos, etc), so this `.onContentChange()` method
		// is kind of a public API, and it should provide "sensible defaults".
		// So, `shouldUpdateReplies` option not being passed (being `undefined`)
		// is assumed to be as if it was `true`.
		//
		else if (shouldUpdateReplies !== false) {
			if (comment.replies && expandReplies) {
				return comment.replies
					.map((reply) => {
						if (reply.hasContentBeenParsed
							&& reply.content
							&& reply.onContentChange({
								_isTriggeredByParentCommentContentChange: true,
								getCommentById
							})) {
							return reply.id
						}
					})
					.filter(_ => _)
			}
			return []
		}
	}
}