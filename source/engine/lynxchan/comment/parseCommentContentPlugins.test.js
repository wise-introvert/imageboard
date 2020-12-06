import PARSE_COMMENT_CONTENT_PLUGINS from './parseCommentContentPlugins.kohlchan'

import expectToEqual from '../../../utility/expectToEqual'
import parseCommentContent from '../../../parseCommentContent'
import splitParagraphs from '../../../splitParagraphs'
import trimContent from '../../../utility/trimContent'

function parseCommentTest(comment, expected, expectedWarnings = []) {
	const consoleWarn = console.warn
	const warnings = []
	console.warn = (text) => warnings.push(text)

	let content = parseCommentContent(comment, {
		plugins: PARSE_COMMENT_CONTENT_PLUGINS
	})

	console.warn = consoleWarn

	content = splitParagraphs(content)
	// `content` internals will be mutated.
	content = trimContent(content)

	expectToEqual(warnings, expectedWarnings)
	expectToEqual(content, expected)
}

describe('parseComment', () => {
	it('should parse markup', () => {
		parseCommentTest(
			'<strong>fett</strong><br><s>strike</s><br><em>italienisch</em><br><u>unterstrichen</u>',
			[
				[
					{
						type: 'text',
						style: 'bold',
						content: 'fett'
					},
					'\n',
					{
						type: 'text',
						style: 'strikethrough',
						content: 'strike'
					},
					'\n',
					{
						type: 'text',
						style: 'italic',
						content: 'italienisch'
					},
					'\n',
					{
						type: 'text',
						style: 'underline',
						content: 'unterstrichen'
					}
				]
			]
		)
	})
})

