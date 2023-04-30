export function compress(data) {
	let [dict, dictSize] = initDict(false);
	let result = [];
	let wip = "";
	for (let i = 0; i < data.length; i++) {
		wip += data[i];
		if (!dict.has(wip)) {
			result.push(dict.get(wip.slice(0, wip.length - 1)));
			dict.set(wip, dictSize++);
			wip = data[i];
		}
	}
	result.push(dict.get(wip));
	return result.map(i => varintEncode(i, dictSize)).join('');
}

export function decompress(data) {
	let [dict, dictSize] = initDict(true);
	let [id, i] = varintDecode(data);
	let result = dict.get(id);
	let prev = result, ch = prev[0];
	while (i < data.length) {
		let id;
		[id, i] = varintDecode(data, i);
		let str;
		if (dict.has(id)) {
			str = dict.get(id);
		} else {
			if (i == 0 || id != dictSize) throw "Invalid input";
			str = prev + ch;
		}
		result += str;
		ch = str[0];
		if (i > 0) dict.set(dictSize++, prev + ch);
		prev = str;
	}
	return result;
}

function initDict(reverse) {
	let dict = new Map(), revDict = new Map();
	let dictSize = 128;
	let ids = 0;

	function add(str, low = false) {
		if (str == '' || dict.has(str)) return;
		if (low && ids >= 0x80) {
			ids++;
			low = false;
		}
		dict.set(str, low ? ids : dictSize);
		revDict.set(low ? ids : dictSize, str);
		if (low) ids++;
		else dictSize++;
		add(str.substring(0, str.length - 1));
	}

	// dictionary optimized for PsiEdit binary format v1 encoded spells
	for (let i = 0; i < 256; i++) add(String.fromCharCode(i), String.fromCharCode(i).match(/[a-z0-9.:_;<=>]/) || i < 0x40);
	[
		'psi:', 'phi:',
		'trick_', 'operator_', 'selector_',
		'constant', 'nearby_', 'list', 'mass_', 'motion', 'block', 'caster',
		'number', 'vector', 'entity',
		'sum', 'subtract', 'multiply', 'divide', 'absolute', 'inverse', 'modulus',
		'sin', 'cos', 'asin', 'acos', 'min', 'max', 'sign', 'square', 'root', 'power', 'log',
		'operator_vector_extract_x', 'operator_vector_extract_y', 'operator_vector_extract_z', 'operator_vector_construct'
	].forEach(e => add(e, true));
	return [reverse ? revDict : dict, dictSize];
}

function varintEncode(value) {
	let result = "";
	do {
		result += String.fromCharCode((value & 0x7f) | (value > 0x7f ? 0x80 : 0));
		value >>>= 7;
	} while (value != 0);
	return result;
}

function varintDecode(data, offset = 0) {
	let result = 0;
	let i = 0;
	while (data.charCodeAt(i + offset) & 0x80) {
		result |= (data.charCodeAt(i + offset) & 0x7f) << (i * 7);
		i++;
	}
	result |= data.charCodeAt(i + offset) << (i * 7);
	return [result, i + 1 + offset];
}
