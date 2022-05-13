/**
 * Performs a "report" API request and parses the response.
 * @param  {object} response — API response JSON.
 * @return {void} Throws an error in case of an error.
 */
export default function parseReportResponse(response) {
	if (response.message === '' && response.message_title === "Ошибок нет") {
		return
	}
	throw new Error(JSON.stringify(response))
}