/**
 * Parses "get boards list page" API response.
 * @param  {any} response
 * @param  {object} [options]
 * @return {object} An object of shape `{ boards: Board[], pageCount }`.
 */
export default function parseBoardsPage(response, options) {
	const { status, data } = response

	if (status !== 'ok') {
		console.error(status)
		if (data) {
			console.error(data)
		}
		throw new Error(status + (typeof data === 'string' ? ': ' + data : ''))
	}

	let { pageCount, boards } = data
	boards = boards.map((board) => ({
		id: board.boardUri,
		title: board.boardName,
		description: board.boardDescription,
		isNotSafeForWork: board.specialSettings && !board.specialSettings.includes('sfw'),
		isLocked: board.specialSettings && board.specialSettings.includes('locked'),
		tags: board.tags
	}))

	if (options.chan === 'kohlchan') {
		const boardCategories = options.boardCategories.map((boardCategory) => ({
			...boardCategory,
			tag: new RegExp(boardCategory.tag)
		}))

		for (const board of boards) {
			const tag = board.tags[0]
			if (tag) {
				const {
					category,
					categoryOrder,
					order
				} = getBoardCategoryAndOrderByTag(board.tags[0], {
					boardCategories
				})
				if (category) {
					board.category = category
					board.categoryOrder = categoryOrder
					board.order = order
				}
			}
		}

		for (const board of boards) {
			if (!board.category) {
				board.category = options.boardCategoryRest
			}
		}

		boards.sort(compareKohlchanBoards)
	}

	return {
		pageCount,
		boards
	}
}

function getBoardCategoryAndOrderByTag(tag, { boardCategories }) {
	let i = 0
	while (i < boardCategories.length) {
		const category = boardCategories[i]
		const match = tag.match(category.tag)
		if (match) {
			const order = parseInt(match[1])
			return {
				category: category.title,
				categoryOrder: i + 1,
				order
			}
		}
		i++
	}
}

function compareKohlchanBoards(a, b) {
	if (a.category && !b.category) {
		return -1
	} else if (!a.category && b.category) {
		return 1
	} else if (!a.category && !b.category) {
		return 0
	} else {
		if (a.categoryOrder && !b.categoryOrder) {
			return -1
		} else if (!a.categoryOrder && b.categoryOrder) {
			return 1
		} else if (!a.categoryOrder && !b.categoryOrder) {
			return 0
		} else {
			if (a.categoryOrder > b.categoryOrder) {
				return 1
			} else if (a.categoryOrder < b.categoryOrder) {
				return -1
			} else {
				if (a.order && !b.order) {
					return -1
				} else if (!a.order && b.order) {
					return 1
				} else if (!a.order && !b.order) {
					return 0
				} else {
					if (a.order > b.order) {
						return 1
					} else if (a.order < b.order) {
						return -1
					} else {
						return 0
					}
				}
			}
		}
	}
}