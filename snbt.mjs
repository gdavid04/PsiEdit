export function snbt2json(snbt) {
	try {
		// try parsing as JSON first
		return JSON.parse(snbt);
	} catch (e) {
		// if that fails, try converting SNBT to JSON
		return JSON.parse(snbt
			.replaceAll(/(?<=^[^"]*(?:"[^"]*(?<!\\)"[^"]*)*)\b[^\W\d]\w*/g, '"$&"')
			.replaceAll(/\b([0-9]+)[bL]/g, '$1'));
	}
}
