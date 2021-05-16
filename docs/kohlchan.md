`kohlchan.net` uses a customized version of `lynxchan` engine.

Note: this document may (or may not entirely) be superceded by the [`lynxchan` API](https://gitlab.com/catamphetamine/imageboard/blob/master/docs/engines/lynxchan.md) description.

### CAPTCHA

To request a CAPTCHA, send a `GET` request to `/captcha.js?d={date}` where `{date}` can be a stringified javascript `Date`, for example `Wed%20May%2005%202021%2000:59:20%20GMT+0300%20(Moscow%20Standard%20Time)`.

The response is HTTP status `302` with `Location` HTTP header being `/.global/captchas/{captchaId}`. Example of `{captchaId}`: `6091c3b9bce7b946ae3c9539`.

After the browser redirects to `/.global/captchas/{captchaId}`, the response is an `image/jpeg` picture of the CAPTCHA "challenge", and a new `captchaid` cookie is created with value `{captchaId}`, `Path` `/` and `Max-Age` `300` meaning that the captcha expires in 300 seconds if not solved.

After that, any "post" action, such as posting a comment, posting a thread, reporting a comment, will also send that `captchaid` cookie (and maybe also a `captchaexpiration` cookie with value example `"Tue, 04 May 2021 22:16:58 GMT"`). If the user has already solved the CAPTCHA challenge, the server will (most likely) ignore the captcha solution

### Post a comment

First, send a `POST` request to `/blockBypass.js?json=1` with `captchaid` cookie.

The server will read `captchaid` and see if the user is required to re-solve a CAPTCHA.

Response example:

```js
{
	status: "ok",
	data: {
		// Not clear what this means.
		valid: false,
		// `mode` can be `1` or `2`.
		// Not clear what it means.
		mode: 1
	}
}
```

Then, for each attachment send a `POST` request to `/checkFileIdentifier.js?json=1&identifier={hash}` where `{hash}` is a SHA-256 hash of the file contents. This checks whether the file is banned from the board (or all boards).

Response example:

```js
{
	status: "ok",
	data: false
}
```

Error example:

```js
{
	status: "error",
	data: "Error message"
}
```

(all error codes are listed in `KohlNumbra` client [source code](https://gitgud.io/LynxChan/PenumbraLynx/blob/master/static/js/api.js))

Then send a `POST` request to `/replyThread.js?json=1` with parameters:

* `boardUri` — Board ID. Example: `"b"`.
* `threadId` — Thread ID. Example: `12345`.
* `name` — Author name.
* `flag` — A custom flag icon to show on the comment. Examples: `"No flag"`, `"5f5fba16b10ca268b3af8b87"`.
* `noFlag` — Whether to not show the flag icon on the comment. Example: `"true"`.
* `subject` — Comment title.
* `message` — Comment text.
* `password` — A random-generated (or user-input) password for comment deletion. Example: `"jovxdvdn"`.
* `sage` — Whether to post a comment with a "sage" (to leave a comment without bumping the thread). Example: `"true"`.
* `spoiler` — Whether to mark the attachments with a "spoiler" mark. Example: `"true"`.
* `files` — Attachments (in binary form).

For each attachment:

* `fileSha256` — A SHA-256 hash of file contents.
* `fileMime` — The MIME-type of the file.
* `fileSpoiler` — Could be left empty. Perhaps something like `1` applies a "spoiler" mark on the attachment.
* `fileName` — Original file name.

Error response example:

```js
{
  status: "error",
  data: "Blank parameter: message, the parameter is not present."
}
```

Files banned error response example:

```js
{
	status: "hashBan",
	data: [{
		file: "File name",
		boardUri: string?,
		reason: string?
	}]
}
```

"Success" response example:

```js
{
	status: "ok",
	data: 1059
}
```

where `data` is the ID of the new comment.

See `KohlNumbra` [source code](https://gitgud.io/Tjark/KohlNumbra/-/blob/master/src/js/thread.js) for full info.