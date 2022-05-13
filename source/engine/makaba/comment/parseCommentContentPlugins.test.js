import PARSE_COMMENT_CONTENT_PLUGINS from './parseCommentContentPlugins.js'

import expectToEqual from '../../../utility/expectToEqual.js'
import parseCommentContent from '../../../parseCommentContent.js'
import splitParagraphs from '../../../splitParagraphs.js'
import trimContent from '../../../utility/trimContent.js'

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
	it('should parse comments', () => {
		parseCommentTest(
			'<a href=\"https:&#47;&#47;www.youtube.org&#47;watch?v=dIFbIUUo0OU\" target=\"_blank\" rel=\"nofollow noopener noreferrer\">https:&#47;&#47;www.youtube.org&#47;watch?v=dIFbIUUo0OU</a>',
			[
				[{
					"type": "link",
					"content": "youtube.org/watch?v=dIFbIUUo0OU",
					"url": "https://www.youtube.org/watch?v=dIFbIUUo0OU",
					"contentGenerated": true
				}]
			]
		)

		parseCommentTest(
			"Помогите найти видео. Там мужик кулаками машет и делат так &quot;уц-уц-уц&quot; или &quot;уш-уш-уш&quot;. Вроде демонстрации кунфу.",
			[
				[
					'Помогите найти видео. Там мужик кулаками машет и делат так "уц-уц-уц" или "уш-уш-уш". Вроде демонстрации кунфу.'
				]
			]
		)

		parseCommentTest(
			"Двачик, мне нужно ненадолго уйти. Присмотри пожалуйста за моим ручный Украинцем, АТО он <strong>ЗАМЕРЗНЕТ</strong>",
			[
				[
					'Двачик, мне нужно ненадолго уйти. Присмотри пожалуйста за моим ручный Украинцем, АТО он ',
					{
						type: 'text',
						style: 'bold',
						content: 'ЗАМЕРЗНЕТ'
					}
				]
			]
		)

		// parseCommentTest(
		// 	'<span class="spoiler">yandex emoji translator</span><br><br>,  ❓   ❓   .    ⚪️➡️    &amp;  .   ❔       ,   ☠ ❓  ,  ‍♂  &amp; ❓ . &amp; ⤴   ⛏   ‍‍,   ❔     &amp;   ⁉    . ‍♂   ‍,   , &amp;    , &amp; ⤴         , ✋️ 9⃣th , ❔      ,  ➡️  ⭕, &amp; ⤴     8⃣ . ❔ ,  ❓"',
		// 	[
		// 		[{
		// 			type: 'spoiler',
		// 			content: 'yandex emoji translator'
		// 		}],
		// 		[
		// 			',  ❓   ❓   .    ⚪️➡️    &  .   ❔       ,   ☠ ❓  ,  ‍♂  & ❓ . & ⤴   ⛏   ‍‍,   ❔     &   ⁉    . ‍♂   ‍,   , &    , & ⤴         , ✋️ 9⃣th , ❔      ,  ➡️  ⭕, & ⤴     8⃣ . ❔ ,  ❓"'
		// 		]
		// 	]
		// )

		parseCommentTest(
			'abc<br>def',
			[
				[
					'abc',
					'\n',
					'def'
				]
			]
		)

		parseCommentTest(
			'<span class="spoiler">Text<br>Text</span>',
			[
				[{
					type: 'spoiler',
					content: [
						'Text',
						'\n',
						'Text'
					]
				}]
			]
		)

		// parseCommentTest(
		// 	'<span class="spoiler">Text<br>- a<br>- b<br>Text<a href="https://github.com/mamkin-coder-228/yoba-brain/blob/master/main.go" target="_blank" rel="nofollow noopener noreferrer">https://github.com/mamkin-coder-228/yoba-brain/blob/master/main.go</a></span>',
		// 	[
		// 		[{
		// 			type: 'spoiler',
		// 			content: [
		// 				'Text',
		// 				'\n',
		// 				'- a',
		// 				'\n',
		// 				'- b',
		// 				'\n',
		// 				'Text',
		// 				{
		// 					type: 'link',
		// 					url: 'https://github.com/mamkin-coder-228/yoba-brain/blob/master/main.go',
		// 					content: 'github.com/mamkin-coder-228/yoba-brain/blob/master/main.go'
		// 				}
		// 			]
		// 		}]
		// 	]
		// )

		parseCommentTest(
			'<strong>test</strong><br><em>test</em><br><span class="unkfunc">&gt;test</span><br><span class=\"u\">test</span><br><span class=\"o\">test</span><br><span class=\"spoiler\">test</span><br><span class=\"s\">test</span><br><sup>test</sup><br><sub>test</sub>',
			[
				[{
					type: 'text',
					style: 'bold',
					content: 'test'
				},
				'\n',
				{
					type: 'text',
					style: 'italic',
					content: 'test'
				},
				'\n',
				{
					type: 'quote',
					block: true,
					content: 'test'
				},
				'\n',
				{
					"type": "text",
					"style": "underline",
					"content": "test"
				},
				"\n",
				{
					"type": "text",
					"style": "overline",
					"content": "test"
				},
				'\n',
				{
					type: 'spoiler',
					content: 'test'
				},
				'\n',
				{
					type: 'text',
					style: 'strikethrough',
					content: 'test'
				},
				'\n',
				{
					type: 'text',
					style: 'superscript',
					content: 'test'
				},
				'\n',
				{
					type: 'text',
					style: 'subscript',
					content: 'test'
				}]
			]
		)

		parseCommentTest(
			'<span class=\"spoiler\">&gt;<span class=\"s\">тест</span></span>',
			[
				[
					{
						"type": "spoiler",
						"content": [
							">",
							{
								"type": "text",
								"style": "strikethrough",
								"content": "тест"
							}
						]
					}
				]
			]
		)

		parseCommentTest(
			'<a href=\"/v/res/3475861.html#3476088\" class=\"post-reply-link\" data-thread=\"3475861\" data-num=\"3476088\">>>3476088</a>',
			[
				[{
					type: 'post-link',
					boardId: 'v',
					threadId: 3475861,
					postId: 3476088,
					url: 'https://2ch.hk/v/res/3475861.html#3476088',
					content: '3476088'
				}]
			]
		)

		parseCommentTest(
			'<span class="unkfunc">&gt;Отмечается, что в ходе <strong>контрснайперской борьбы</strong>, украинский снайпер ликвидировал Порошенко. </span>',
			[
				[
					{
						"type": "quote",
						"block": true,
						"content": [
							"Отмечается, что в ходе ",
							{
								"type": "text",
								"style": "bold",
								"content": "контрснайперской борьбы"
							},
							", украинский снайпер ликвидировал Порошенко."
						]
					}
				]
			]
		)

		parseCommentTest(
			'<strong>вопрос к тням</strong><br>Несколько лет назад...<br><br>Так же, пост из моего прошлого треда, на эту же тему:<br><em>...</em><br><br><br><span class="unkfunc">&gt;Дискасс.</span>',
			[
				[
					{
						type: 'text',
						style: 'bold',
						content: 'вопрос к тням'
					},
					'\n',
					'Несколько лет назад...'
				],
				[
					'Так же, пост из моего прошлого треда, на эту же тему:',
					'\n',
					{
						type: 'text',
						style: 'italic',
						content: '...'
					}
				],
				[
					{
						type: 'quote',
						block: true,
						content: 'Дискасс.'
					}
				]
			]
		)

		parseCommentTest(
			' Abc <br><br><br> Def <br><br> <br> Ghi ',
			[
				[
					'Abc'
				],
				[
					'Def'
				],
				[
					'Ghi'
				]
			]
		)

		parseCommentTest(
			"<a href=\"/v/res/3749775.html#3756724\" class=\"post-reply-link\" data-thread=\"3749775\" data-num=\"3756724\">>>3756724</a><br>А зачем тогда нужна концовка Гаруспика? У концовки Бакалавра смысл есть (<a href=\"/v/res/3749775.html#3755913\" class=\"post-reply-link\" data-thread=\"3749775\" data-num=\"3755913\">>>3755913</a>). У концовки Самозванки тоже смысл вроде как есть (<a href=\"/v/res/3749775.html#3755928\" class=\"post-reply-link\" data-thread=\"3749775\" data-num=\"3755928\">>>3755928</a>).",
			[
				[
					{
						"type": "post-link",
						"boardId": "v",
						"threadId": 3749775,
						"postId": 3756724,
						"content": "3756724",
						"url": "https://2ch.hk/v/res/3749775.html#3756724"
					},
					"\n",
					"А зачем тогда нужна концовка Гаруспика? У концовки Бакалавра смысл есть (",
					{
						"type": "post-link",
						"boardId": "v",
						"threadId": 3749775,
						"postId": 3755913,
						"content": "3755913",
						"url": "https://2ch.hk/v/res/3749775.html#3755913"
					},
					"). У концовки Самозванки тоже смысл вроде как есть (",
					{
						"type": "post-link",
						"boardId": "v",
						"threadId": 3749775,
						"content": "3755928",
						"postId": 3755928,
						"url": "https://2ch.hk/v/res/3749775.html#3755928"
					},
					")."
				]
			]
		)

		parseCommentTest(
			"<span class='u'><span class='o'><em><strong><sup><sub>ХРАМ ПЕПЕ-ИИСУСА</sub></sup></strong></em></span></span><br><br><strong><em>Здравствуй, мой дорогой анон</em></strong>.",
			[
				[
					{
						"type": "text",
						"style": "underline",
						"content": [
							{
								"type": "text",
								"style": "overline",
								"content": [
									{
										"type": "text",
										"style": "italic",
										"content": [
											{
												"type": "text",
												"style": "bold",
												"content": [
													{
														"type": "text",
														"style": "superscript",
														"content": [
															{
																"type": "text",
																"style": "subscript",
																"content": "ХРАМ ПЕПЕ-ИИСУСА"
															}
														]
													}
												]
											}
										]
									}
								]
							}
						]
					}
				],
				[
					{
						"type": "text",
						"style": "bold",
						"content": [
							{
								"type": "text",
								"style": "italic",
								"content": "Здравствуй, мой дорогой анон"
							}
						]
					},
					"."
				]
			]
		)
	})
})