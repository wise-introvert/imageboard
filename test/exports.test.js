import {
	default as Chan,
	getConfig,
	getCommentText,
	// generateQuotes,
	// generatePreview,
	// generateThreadTitle,
	// setPostLinkQuotes
} from '../index.js'

describe('exports', () => {
	it('should export ES6', () => {
		Chan.should.be.a('function')
		getConfig.should.be.a('function')
		getConfig('4chan').id.should.equal('4chan')
		getCommentText.should.be.a('function')
		// generateQuotes.should.be.a('function')
		// generatePreview.should.be.a('function')
		// generateThreadTitle.should.be.a('function')
		// setPostLinkQuotes.should.be.a('function')
	})

	it('should export CommonJS', () => {
		const Library = require('../index.commonjs.js')
		Library.should.be.a('function')
		Library.default.should.be.a('function')
		Library.getConfig.should.be.a('function')
		Library.getConfig('4chan').id.should.equal('4chan')
		Library.getCommentText.should.be.a('function')
		// Library.generateQuotes.should.be.a('function')
		// Library.generatePreview.should.be.a('function')
		// Library.generateThreadTitle.should.be.a('function')
		// Library.setPostLinkQuotes.should.be.a('function')
	})
})