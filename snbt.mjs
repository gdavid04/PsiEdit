export function snbt2json(snbt) {
	try {
		// try parsing as JSON first
		return JSON.parse(snbt);
	} catch (e) {
		// if that fails, try converting SNBT to JSON
		// this is a temporary hack until I write a proper SNBT parser
		return JSON.parse(snbt
			.replaceAll(/\b[^\W\d][\w\.]*(?=[^"]*(?:"(?:(?:[^"]|\\")*)?"[^"]*)*$)/g, '"$&"')
			.replaceAll(/\b([0-9]+)[a-zA-Z](?=[^"]*(?:"(?:(?:[^"]|\\")*)?"[^"]*)*$)/g, '$1'));
	}
}
