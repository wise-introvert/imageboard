# lynxchan

While [adding support](http://lynxhub.com/lynxchan/res/722.html#q984) for [`lynxchan`](https://gitgud.io/LynxChan/LynxChan) several issues have been discovered in the `lynxchan` engine (as of June 2019).

* No "get boards list" API (like `/boards.json` on `4chan.org`).
* [No thread creation date](https://gitlab.com/catamphetamine/imageboard/-/issues/1) on threads in `/catalog.json` API response.
* No `signedRole` (thread author role) property on threads in `/catalog.json` API response.
* No "unique IPs" counter on threads in "get thread" API response.
* No `authorId`s returned by JSON API while they're present on HTML pages.
* No duration for video files.
* No width and height for thumbnails in `files[]` array entries of a post. A workaround would be calculating thumbnail width and height from the original image dimensions, but that wouldn't be precise because it's not said how exactly the thumbnail engine rounds fractional pixels.
* [No `files[]` array](https://gitlab.com/catamphetamine/imageboard/-/issues/1#note_394918880) on threads in `/catalog.json` API response. Only a single `thumb` URL.
* (`kohlchan.net` addon) Provides `files[]` array on threads in `/catalog.json` API response, but doesn't provide "original" file name for files in the `files[]` array. For example, there's no "original" name for `*.txt` files in `/catalog.json` API response.
* (can be hacked around in a web browser) No `width` and `height` of the `thumb` thumbnail URL on threads in `/catalog.json` API response.
* (can be hacked around in a web browser) No "original" image URL for the `thumb` thumbnail URL on threads in `/catalog.json` API response.
* (can be hacked around in a web browser) No `width` and `height` of the "original" image URL for the `thumb` thumbnail URL on threads in `/catalog.json` API response.
* (can be hacked around) No `postCount` and `fileCount` in "get thread" API response.
* (can be hacked around) No `mime` and `size` for the `thumb` thumbnail URL on threads in `/catalog.json` API response.
* (can be hacked around) No `postCount` for threads in `/catalog.json` API response when they have no replies.
* (can be hacked around) No `fileCount` for threads in `/catalog.json` API response when they have no attachments in replies.