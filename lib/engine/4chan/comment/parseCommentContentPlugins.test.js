import { parseHtmlContent } from 'social-components-parser'

import PARSE_COMMENT_PLUGINS from './parseCommentContentPlugins.4chan.js'

import expectToEqual from '../../../utility/expectToEqual.js'
import trimContent from '../../../utility/trimContent.js'

import getContentElementsForUnknownElementType from '../../../parseAndFormatCommentContent.getContentElementsForUnknownElementType.js'

function parseCommentTest(comment, expected, expectedWarnings = []) {
	const consoleWarn = console.warn
	const warnings = []
	console.warn = (text) => warnings.push(text)

	let content = parseHtmlContent(comment, {
		syntax: PARSE_COMMENT_PLUGINS,
		getContentElementsForUnknownElementType
	})

	console.warn = consoleWarn

	if (typeof content === 'string') {
		content = [[content]]
	}

	// `content` internals will be mutated.
	content = trimContent(content)

	expectToEqual(warnings, expectedWarnings)
	expectToEqual(content, expected)
}

describe('parseComment', () => {
	it('should strip unmatched/unknown tags', () => {
		parseCommentTest(
			'<div align=\"center\"><br><h1><blink><font color=\"red\">\/s\/ is NOT for \/r\/EQUESTS<\/font><\/blink><\/h1><br><h1><font color=\"red\">Do not start a thread if you don\'t have at least 6 related pictures to post in it.<\/font><\/h1><br><br><\/div>',
			[
				[
					"/s/ is NOT for /r/EQUESTS",
				],
				[
					"Do not start a thread if you don't have at least 6 related pictures to post in it."
				]
			],
			[
				// '[imageboard] Unsupported markup found:',
				// '[imageboard] Unsupported markup found:',
				// '[imageboard] Unsupported markup found:',
				// '[imageboard] Unsupported markup found:',
				// '[imageboard] Unsupported markup found:',
				// '[imageboard] Unsupported markup found:'
			]
		)
	})

	it('should parse `<pre/>`s', () => {
		parseCommentTest(
			'High quality video output profile (goes into mpv.conf):<br><br><pre class=\"prettyprint\">profile=gpu-hq<\/pre><br><br><br>Configuration Files:',
			[
				[
					'High quality video output profile (goes into mpv.conf):'
				],
				{
					type: 'code',
					content: 'profile=gpu-hq'
				},
				[
					'Configuration Files:'
				]
			]
		)

		parseCommentTest(
			"Wiki:<br>https:\/\/github.com\/mpv-player\/mpv\/wiki<br><br>Manual:<br>Stable: https:\/\/mpv.io\/manual\/stable\/<br>Git: https:\/\/mpv.io\/manual\/master\/<br><br><br>User Scripts &amp; Shaders:<br>https:\/\/github.com\/mpv-player\/mpv\/wiki\/User-Scripts<br><br><br>High quality video output profile (goes into mpv.conf):<br><br><pre class=\"prettyprint\">profile=gpu-hq<\/pre><br><br><br>Configuration Files:<br>https:\/\/mpv.io\/manual\/master\/#configuration-files<br>https:\/\/mpv.io\/manual\/master\/#files<br><br>Input.conf:<br>https:\/\/github.com\/mpv-player\/mpv\/blob\/master\/etc\/input.conf<br><br>Post your system specs and config if you&#039;re asking performance related questions.<br><br>Windows Builds:<br>https:\/\/sourceforge.net\/projects\/mpv-player-windows\/files\/<br><br>(Updated with the other ewa* scalers) Evaluating mpv&#039;s upscaling algorithms:<br>https:\/\/artoriuz.github.io\/mpv_upscaling.html",
			[
				[
					"Wiki:",
					"\n",
					"https://github.com/mpv-player/mpv/wiki"
				],
				[
					"Manual:",
					"\n",
					"Stable: https://mpv.io/manual/stable/",
					"\n",
					"Git: https://mpv.io/manual/master/"
				],
				[
					"User Scripts & Shaders:",
					"\n",
					"https://github.com/mpv-player/mpv/wiki/User-Scripts"
				],
				[
					"High quality video output profile (goes into mpv.conf):"
				],
				{
					type: "code",
					content: "profile=gpu-hq"
				},
				[
					"Configuration Files:",
					"\n",
					"https://mpv.io/manual/master/#configuration-files",
					"\n",
					"https://mpv.io/manual/master/#files"
				],
				[
					"Input.conf:",
					"\n",
					"https://github.com/mpv-player/mpv/blob/master/etc/input.conf"
				],
				[
					"Post your system specs and config if you're asking performance related questions."
				],
				[
					"Windows Builds:",
					"\n",
					"https://sourceforge.net/projects/mpv-player-windows/files/"
				],
				[
					"(Updated with the other ewa* scalers) Evaluating mpv's upscaling algorithms:",
					"\n",
					"https://artoriuz.github.io/mpv_upscaling.html"
				]
			]
		)
	})
})

