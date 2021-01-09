import generatePostQuote from 'social-components/commonjs/utility/post/generatePostQuote'
import trimText from 'social-components/commonjs/utility/post/trimText'

/**
 * If `thread.title` is missing then either copy it
 * from the first comment's `title` or attempt to
 * autogenerate it from the first comment's `content`.
 * @param {object} thread
 * @param {object} [options.messages]
 * @param {number} [options.maxLength] — See `maxLength` argument of `trimText()` in `social-components`.
 * @param {number} [options.minFitFactor] — See `minFitFactor` option of `trimText()` in `social-components`.
 * @param {number} [options.maxFitFactor] — See `maxFitFactor` option of `trimText()` in `social-components`.
 * @param {boolean} [options.parseContent] — The `parseContent` option used when constructing an imageboard instance.
 */
export default function generateThreadTitle(thread, options = {}) {
	const {
		// (optional)
		// `messages: object?`
		// "Messages" ("strings", "labels") used when generating comment `content` text.
		messages,
		// (optional)
		// `parseContent: boolean?`
		// If `parseContent: false` is used to skip parsing comments' `content`
		// when using `Chan` methods then `parseContent: false` option should also be
		// passed here so indicate that the "opening" comment `content`
		// (raw unparsed HTML markup) should be ignored.
		parseContent,
		// (optional)
		// Maximum length of an autogenerated thread title.
		// Is `60` by default.
		maxLength,
		minFitFactor,
		maxFitFactor
	} = options
	if (!thread.title) {
		const comment = thread.comments[0]
		if (comment.title) {
			thread.title = comment.title
		} else if (parseContent !== false) {
			thread.autogeneratedTitle = generatePostQuote(comment, {
				messages,
				maxLength: maxLength || 60,
				minFitFactor,
				maxFitFactor,
				stopOnNewLine: true
			})
		}
	}
}