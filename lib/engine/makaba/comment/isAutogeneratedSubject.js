import { decodeHTML } from 'entities'

/**
 * This is a reverse-engineered guess of
 * 2ch.hk's subject autogeneration algorithm.
 * For example, it's used in `/b/` and `/rf/`.
 * @param  {string}  subject
 * @param  {string}  content
 * @return {Boolean}
 */
export default function isAutogeneratedSubject(subject, content) {
	// `content` is already trimmed, so `subject` should be trimmed too for the comparison.
	subject = subject.trim()
	// For some weird reason, some characters are not decoded in `subject`:
	// * &amp;
	// * &lt;
	// * &gt;
	const subjectLengthBefore = subject.length
	subject = subject
		.replace(ESCAPED_AMPERSAND_REGEXP, '&')
		.replace(ESCAPED_LESS_THAN_REGEXP, '<')
		.replace(ESCAPED_GREATER_THAN_REGEXP, '>')
	const subjectLengthAfter = subject.length
	const removedSubjectCharactersCount = subjectLengthBefore - subjectLengthAfter

	let contentText = content
		.replace(/<br>/g, ' ')
		.replace(/<.+?>/g, '')
	contentText = decodeHTML(contentText)
	const autogeneratedSubject = contentText
		.slice(0, MAX_CHARACTER_LIMIT - removedSubjectCharactersCount)
		// Re-trim the content because it has changed.
		.trim()

	return subject === autogeneratedSubject
}

const MAX_CHARACTER_LIMIT = 100

const ESCAPED_AMPERSAND_REGEXP = /&amp;/g
const ESCAPED_LESS_THAN_REGEXP = /&lt;/g
const ESCAPED_GREATER_THAN_REGEXP = /&gt;/g