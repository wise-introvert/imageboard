export function setParameters(string, parameters) {
	for (const key of Object.keys(parameters)) {
		string = string.replace('{' + key + '}', parameters[key])
	}
	return string
}

export function getParameters(object, params) {
	const newObject = {}
	for (const key of Object.keys(object)) {
		newObject[key] = getParameterValue(object[key], params)
	}
	return newObject
}

export function getParameterValue(parameter, params) {
	if (parameter.value !== undefined) {
		return parameter.value
	}
	let value
	if (parameter.parameter) {
		value = params[parameter.parameter]
		if (value) {
			if (parameter.index) {
				value = value[parameter.index]
			}
		}
	}
	if (parameter.switch) {
		for (const key of Object.keys(parameter.switch)) {
			if (value === convertValue(key, parameter.type)) {
				return parameter.switch[key]
			}
		}
		return parameter.default
	}
	if (parameter.type) {
		value = convertValue(value, parameter.type)
	}
	if (value === undefined) {
		return parameter.default
	}
	return value
}

function convertValue(value, type) {
	if (value === undefined) {
		return
	}
	switch (type) {
		case 'boolean':
			if (typeof value === 'string') {
				switch (value) {
					case 'true':
						return true
					case 'false':
						return false
					default:
						return
				}
			}
			return
		case 'numeric-boolean':
			if (typeof value === 'boolean') {
				return value ? 1 : 0
			}
			return
		case 'number':
			return parseInt(value)
		default:
			return value
	}
}

export function addQueryParameters(url, parameters) {
	if (parameters) {
		return url +
			(url.indexOf('?') < 0 ? '?' : '&') +
			Object.keys(parameters).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(parameters[key])}`).join('&')
	}
	return url
}