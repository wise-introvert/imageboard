'use strict'

exports = module.exports = require('./commonjs/Chan.js').default

// Added `/index.js` so that there's no warning:
// "There are multiple modules with names that only differ in casing.
//  This can lead to unexpected behavior when compiling on a filesystem with other case-semantic."
exports.getConfig = require('./commonjs/chan/getConfig.js').default
exports.getCommentText = require('./commonjs/getCommentText.js').default
// exports.generateQuotes = require('./commonjs/generateQuotes.js').default
// exports.generatePreview = require('./commonjs/generatePreview.js').default
// exports.generateThreadTitle = require('./commonjs/generateThreadTitle.js').default
// exports.setPostLinkQuotes = require('./commonjs/setPostLinkQuotes.js').default

exports['default'] = require('./commonjs/Chan.js').default