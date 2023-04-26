export function compress(data) {
	let dict = new Map();
	let dictSize = 256;
	for (let i = 0; i < 256; i++) dict.set(String.fromCharCode(i), String.fromCharCode(i) + String.fromCharCode(0));
	let result = "";
	let wip = "";
	for (let i = 0; i < data.length; i++) {
		wip += data[i];
		if (!dict.has(wip)) {
			result += dict.get(wip.slice(0, wip.length - 1));
			dict.set(wip, String.fromCharCode(dictSize & 0xff) + String.fromCharCode(dictSize >> 8));
			if (dictSize++ == 65536) throw "Input too large"; // TODO: handle inputs > 64k
			wip = data[i];
		}
	}
	result += dict.get(wip);
	return result;
}

export function decompress(data) {
	let dict = new Map();
	let dictSize = 256;
	for (let i = 0; i < 256; i++) dict.set(i, String.fromCharCode(i));
	let result = "";
	let prev, ch;
	for (let i = 0; i < data.length; i += 2) {
		let id = data.charCodeAt(i) + (data.charCodeAt(i + 1) << 8);
		let str;
		if (dict.has(id)) {
			str = dict.get(id);
		} else {
			if (i == 0 || id != dictSize) throw "Invalid input";
			str = prev + ch;
		}
		result += str;
		ch = str[0];
		if (i > 0) {
			dict.set(dictSize, prev + ch);
			if (dictSize++ == 65536) throw "Input too large"; // TODO: handle inputs > 64k
		}
		prev = str;
	}
	return result;
}
