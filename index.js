// Added `/index.js` so that there's no warning:
// "There are multiple modules with names that only differ in casing.
//  This can lead to unexpected behavior when compiling on a filesystem with other case-semantic."
export { default as default } from './modules/Chan.js'
export { default as getConfig } from './modules/chan/getConfig.js'
export { default as getCommentText } from './modules/getCommentText.js'
// export { default as generateQuotes } from './modules/generateQuotes.js'
// export { default as generatePreview } from './modules/generatePreview.js'
// export { default as generateThreadTitle } from './modules/generateThreadTitle.js'
// export { default as setPostLinkQuotes } from './modules/setPostLinkQuotes.js'