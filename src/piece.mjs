import { pieces } from './main.mjs';
import { loadHTML, loadJSON } from './util.mjs';

// used by PsiEdit format to compress parameter names
const builtinArgs = [ 'target', 'number', 'number1', 'number2', 'number3', 'number4', 'vector1', 'vector2', 'vector3', 'vector4', 'position', 'min', 'max', 'power','x', 'y', 'z', 'radius', 'distance', 'time', 'base','ray', 'vector', 'axis', 'angle', 'pitch', 'instrument', 'volume', 'list1', 'list2', 'list', 'direction', 'from1', 'from2', 'to1', 'to2', 'root', 'toggle', 'mask', 'channel', 'slot', 'ray_end', 'ray_start' ];

export function setPiece(cell, piece) {
	removePiece(cell);
	cell.element.append(piece);
	cell.piece = piece;
}

export function removePiece(cell) {
	if (!cell.piece) return;
	cell.piece.remove();
	cell.piece = null;
}

export function createPiece(template) {
	// TODO: placeholder for unknown pieces
	return template.cloneNode(true);
}

export function setParamSide(param, side, selected = null, editor = null) {
	param.dataset.side = side;
	if (editor) createEditor(editor, selected);
	let line = param.parentNode.querySelector(`.line[data-trigger='${param.dataset.key}']`);
	if (line) line.dataset.side = side;
}

export function getParamSide(param) {
	return param.dataset.side;
}

export function isParamOptional(param) {
	return param.dataset.optional != null;
}

export function getSortingName(piece) {
	return piece.dataset.sortingName.toLowerCase();
}

let paramControl, valueControl, textControl, relatedControl;
import controlsUrl from './controls.html?url';
loadHTML(controlsUrl).then(r => {
	paramControl = r.querySelector('.param-control');
	relatedControl = r.querySelector('.related-control');
	valueControl = r.querySelector('.value-control');
	textControl = r.querySelector('.text-control');
});

export function createEditor(editor, selected) {
	removeEditor(editor);
	if (!selected.cell || !selected.cell.piece) return;
	let piece = selected.cell.piece;
	editor.element.style.setProperty('--piece-name', '"' + piece.dataset.name + '"');
	editor.element.style.setProperty('--piece-desc', '"' + piece.dataset.desc + '"');
	piece.querySelectorAll('.param').forEach(param => {
		let elem = paramControl.cloneNode(true);
		elem.style.setProperty('--param-name', '"' + param.dataset.name + '"');
		if (param.dataset.color != null) elem.dataset.color = param.dataset.color;
		if (param.dataset.side != null) elem.dataset.side = param.dataset.side;
		if (param.dataset.optional != null) elem.dataset.optional = param.dataset.optional;
		elem.querySelectorAll('[data-side]').forEach(side => side.addEventListener('click', () => {
			setParamSide(param, side.dataset.side, selected, editor);
		}));
		editor.element.append(elem);
		editor.controls.push(elem);
		editor.params.push(param);
	});
	if (piece.dataset.key == 'psi:constant_number') {
		let elem = valueControl.cloneNode(true);
		elem.style.setProperty('--param-name', '"' + 'Value' + '"');
		elem.dataset.color = 'gray';
		let value = elem.querySelector('[data-value]');
		value.value = piece.querySelector('[data-value]').textContent;
		value.addEventListener('input', () => {
			let pieceValue = piece.querySelector('[data-value]');
			pieceValue.textContent = value.value = value.value.substring(0, 5);
			pieceValue.style.setProperty('--scale-value', [ 1, 1, 0.8, 0.7, 0.6, 0.5 ][value.value.length - 1]);
		});
		editor.element.append(elem);
		editor.controls.push(elem);
	}
	/* comment */ {
		let elem = textControl.cloneNode(true);
		elem.style.setProperty('--param-name', '"' + 'Comment' + '"');
		elem.dataset.color = 'gray';
		let value = elem.querySelector('[data-value]');
		value.value = (piece.dataset.comment || '').replaceAll(';', '\n');
		value.addEventListener('input', () => piece.dataset.comment = value.value.replaceAll('\n', ';'));
		editor.element.append(elem);
		editor.controls.push(elem);
		editor.comment = value;
	}
	if (piece.dataset.related) {
		for (let group of piece.dataset.related.split(' ')) {
			let elem = relatedControl.cloneNode(true);
			elem.style.setProperty('--param-name', '"' + group.substring(0, group.indexOf('=')) + '"');
			elem.dataset.color = 'gray';
			let pieceList = elem.querySelector('[data-pieces]');
			for (let pc of group.substring(group.indexOf('=') + 1).split(',')) {
				let item = pieceList.div('catalog-item');
				let pcn = pc.includes(':') ? pc : piece.dataset.key.substring(0, piece.dataset.key.indexOf(':')) + ':' + pc;
				item.append(pieces[pcn].cloneNode(true));
				item.addEventListener('click', () => {
					setPiece(selected.cell, createPiece(pieces[pcn]));
					// TODO copy shared piece data
					createEditor(editor, selected);
				});
			}
			editor.element.append(elem);
			editor.controls.push(elem);
		}
	}
}

export function removeEditor(editor) {
	editor.element.style.removeProperty('--piece-name');
	editor.element.style.removeProperty('--piece-desc');
	editor.controls.forEach(e => e.remove());
	editor.controls = [];
	editor.params = [];
	editor.values = [];
	editor.comment = null;
}

export async function loadPieces(html) {
	let pieces = {}, repo, namespace, lang;
	html.querySelectorAll('meta').forEach(e => {
		repo = repo || e.dataset.repo;
		namespace = namespace || e.dataset.namespace;
	});
	if (!repo || !namespace) {
		console.error('Missing metadata in piece list');
		return pieces;
	}
	html.querySelectorAll('[data-icon]').forEach(e => {
		e.style.setProperty('--icon', `url('https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/textures/spell/${e.dataset.icon}.png')`);
	});
	try {
		lang = await loadJSON(`https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/lang/en_us.json`);
	} catch {} // eslint-disable-line no-empty
	lang = lang || {};
	html.querySelectorAll('.piece').forEach(e => {
		if (repo && namespace) {
			e.style.setProperty('--piece-icon', `url('https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/textures/spell/${e.dataset.icon || e.dataset.type}.png')`);
		}
		e.dataset.name = e.dataset.name || lang[`${namespace}.spellpiece.${e.dataset.type}`] || `${namespace}.spellpiece.${e.dataset.type}`;
		e.dataset.desc = e.dataset.desc || lang[`${namespace}.spellpiece.${e.dataset.type}.desc`] || `${namespace}.spellpiece.${e.dataset.type}.desc`;
		e.dataset.key = e.dataset.key || `${namespace}:${e.dataset.type}`;
		e.dataset.sortingName = e.dataset.sortingName || e.dataset.name;
		e.dataset.tooltip = e.dataset.name + '\n' + e.dataset.desc;
		pieces[e.dataset.key] = e;
	});
	return pieces;
}

export function exportPiece(piece, compact = false) {
	if (compact) {
		let res = [];
		let keyBuf = new TextEncoder().encode(piece.dataset.key);
		if (keyBuf.length > 0xFF) throw new Error('Key too long');
		res.push(new Uint8Array([ keyBuf.length & 0xFF ]));
		res.push(keyBuf);
		let commentBuf = new TextEncoder().encode(piece.dataset.comment || '');
		if (commentBuf.length > 0xFFFF) throw new Error('Comment too long');
		res.push(new Uint8Array([ commentBuf.length & 0xFF, (commentBuf.length >> 8) & 0xFF ]));
		res.push(commentBuf);
		let params = {};
		piece.querySelectorAll('.param').forEach(param => {
			if (param.dataset.side != 'off') params[param.dataset.key] = sideToInt(param.dataset.side);
		});
		if (Object.keys(params).length > 0xFF) throw new Error('Too many params');
		res.push(new Uint8Array([ Object.keys(params).length & 0xFF ]));
		for (let key in params) {
			if (key.startsWith('_') && builtinArgs.includes(key.substring(1))) {
				res.push(new Uint8Array([ 0xFF, builtinArgs.indexOf(key.substring(1)) ]));
			} else {
				let keyBuf = new TextEncoder().encode(key);
				if (key.length > 0xFE) throw new Error('Param key too long');
				res.push(new Uint8Array([ keyBuf.length & 0xFF ]));
				res.push(keyBuf);
			}
			res.push(new Uint8Array([ params[key] & 0xFF ]));
		}
		if (piece.dataset.key == 'psi:constant_number') {
			let value = piece.querySelector('[data-value]').textContent;
			let valueBuf = new TextEncoder().encode(value);
			res.push(new Uint8Array([ valueBuf.length & 0xFF ]));
			res.push(valueBuf);
		}
		let raw = new Uint8Array(res.map(e => e.length).reduce((a, b) => a + b));
		let offset = 0;
		for (let elem of res) {
			raw.set(elem, offset);
			offset += elem.length;
		}
		return raw;
	}
	let params = {};
	let hasParams = false;
	piece.querySelectorAll('.param').forEach(param => {
		params[param.dataset.key] = sideToInt(param.dataset.side);
		hasParams = true;
	});
	let res = { key: piece.dataset.key };
	if (piece.dataset.comment != '') res.comment = piece.dataset.comment;
	if (hasParams) res.params = params;
	if (piece.dataset.key == 'psi:constant_number') {
		res.constantValue = piece.querySelector('[data-value]').textContent;
	}
	return res;
}

export function importPiece(data) {
	if (data instanceof Uint8Array) {
		let offset = 0;
		let keyLength = data[offset++];
		let key = new TextDecoder().decode(data.slice(offset, offset + keyLength));
		let piece = createPiece(pieces[key]);
		offset += keyLength;
		let commentLength = data[offset++] | (data[offset++] << 8);
		piece.dataset.comment = new TextDecoder().decode(data.slice(offset, offset + commentLength));
		offset += commentLength;
		let paramCount = data[offset++];
		for (let i = 0; i < paramCount; i++) {
			let paramKeyLength = data[offset++];
			let paramKey;
			if (paramKeyLength == 0xFF) {
				paramKey = '_' + builtinArgs[data[offset++]];
			} else {
				paramKey = new TextDecoder().decode(data.slice(offset, offset + paramKeyLength));
				offset += paramKeyLength;
			}
			let paramSide = data[offset++];
			setParamSide(piece.querySelector(`.param[data-key="${paramKey}"]`), intToSide(paramSide));
		}
		if (key == 'psi:constant_number') {
			let valueLength = data[offset++];
			let value = new TextDecoder().decode(data.slice(offset, offset + valueLength));
			offset += valueLength;
			let valueElem = piece.querySelector('[data-value]');
			valueElem.textContent = value;
			valueElem.style.setProperty('--scale-value', [ 1, 1, 0.8, 0.7, 0.6, 0.5 ][value.length - 1]);
		}
		return piece;
	}
	let piece = createPiece(pieces[data.key]);
	if (data.params) {
		for (const [param, side] of Object.entries(data.params)) {
			setParamSide(piece.querySelector(`.param[data-key="${param}"]`), intToSide(side));
		}
	}
	if (data.comment) piece.dataset.comment = data.comment;
	// TODO keep unknown data
	if (data.constantValue) {
		let value = piece.querySelector('[data-value]');
		value.textContent = data.constantValue;
		value.style.setProperty('--scale-value', [ 1, 1, 0.8, 0.7, 0.6, 0.5 ][data.constantValue.length - 1]);
	}
	return piece;
}

function sideToInt(side) {
	return { off: 0, top: 1, bottom: 2, left: 3, right: 4 }[side || 'off'];
}

function intToSide(side) {
	return [ 'off', 'top', 'bottom', 'left', 'right' ][side];
}

export function oppositeSide(side) {
	return { left: 'right', right: 'left', top: 'bottom', bottom: 'top', off: 'off' }[side];
}

export function pieceInterceptKey(ch, selected, editor = null) {
	if (!selected.cell || !selected.cell.piece) return false;
	let piece = selected.cell.piece;
	if (piece.dataset.key == 'psi:constant_number') {
		// Phi style number constant editing
		if ('FDfd'.includes(ch)) return false;
		let value = piece.querySelector('[data-value]');
		let tmp = value.textContent;
		if (ch == 'Backspace') {
			if (tmp.startsWith('.')) tmp = '0' + tmp;
			else if (tmp.startsWith('-.')) tmp = '-0' + tmp.substring(1);
			if (tmp == '-0') tmp = '0';
			else if (tmp.startsWith('-') && tmp.length == 2) tmp = '-0';
			else tmp = tmp.substring(0, tmp.length - 1).trim();
		} else {
			if ((tmp == '0' || tmp == '-0') && ch != '-' && ch != '+') tmp = tmp.replace('0', '');
			if (ch == '+') {
				if (tmp.startsWith('-')) tmp = tmp.substring(1);
			} else if (ch == '-') {
				if (!tmp.startsWith('-')) tmp = '-' + tmp;
			} else tmp = (tmp + ch).trim();
			if (tmp.length > 5) {
				if (tmp.startsWith('0.')) tmp = tmp.substring(1);
				else if (tmp.startsWith('-0.')) tmp = '-' + tmp.substring(2);
			} else {
				if (tmp.startsWith('.')) tmp = '0' + tmp;
				else if (tmp.startsWith('-.')) tmp = '-0' + tmp.substring(1);
			}
			if (tmp.length > 5) return false;
		}
		if (tmp == '') tmp = '0';
		if (isNaN(parseFloat(tmp))) return false;
		value.textContent = tmp;
		value.style.setProperty('--scale-value', [ 1, 1, 0.8, 0.7, 0.6, 0.5 ][tmp.length - 1]);
		if (editor) createEditor(editor, selected);
		return true;
	}
	return false;
}
