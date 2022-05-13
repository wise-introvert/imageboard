import expectToEqual from './utility/expectToEqual.js'

import parseLinksInText from './parseLinksInText.js'

describe('parseLinksInText', () => {
	it('shouldn\'t parse links in text when there are no links in text', () => {
		let content = [
			[
				'Abc'
			]
		]
		parseLinksInText(content)
		expectToEqual(
			content,
			[
				[
					'Abc'
				]
			]
		)

		content = [
			{
				type: 'attachment',
				attachmentId: 1
			}
		]
		parseLinksInText(content)
		expectToEqual(
			content,
			[
				{
					type: 'attachment',
					attachmentId: 1
				}
			]
		)
	})

	it('should parse links in text', () => {
		const content = [
			[
				'Abc http://twitter.net/abc def'
			]
		]
		parseLinksInText(content)
		expectToEqual(
			content,
			[
				[
					'Abc ',
					{
						type: 'link',
						url: 'http://twitter.net/abc',
						content: 'twitter.net/abc',
						contentGenerated: true
					},
					' def'
				]
			]
		)
	})

	it('shouldn\'t parse links inside blocks', () => {
		const content = [
			[
				{
					type: 'quote',
					content: 'Abc http://twitter.net/abc def'
				},
				'Abc http://twitter.net/abc def',
				{
					type: 'link',
					url: 'http://twitter.net/abc',
					content: 'Abc http://twitter.net/abc def'
				}
			]
		]
		parseLinksInText(content)
		expectToEqual(
			content,
			[
				[
					{
						type: 'quote',
						content: 'Abc http://twitter.net/abc def'
					},
					'Abc ',
					{
						type: 'link',
						url: 'http://twitter.net/abc',
						content: 'twitter.net/abc',
						contentGenerated: true
					},
					' def',
					{
						type: 'link',
						url: 'http://twitter.net/abc',
						content: 'Abc http://twitter.net/abc def'
					}
				]
			]
		)
	})
})
