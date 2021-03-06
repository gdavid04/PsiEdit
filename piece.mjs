import { loadHTML, loadJSON } from './util.mjs';

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

let paramControl;
loadHTML('controls.html').then(r => {
	paramControl = r.querySelector('.param-control');
});

export function createEditor(editor, selected) {
	removeEditor(editor);
	if (!selected.cell || !selected.cell.piece) return;
	let piece = selected.cell.piece;
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
}

export function removeEditor(editor) {
	editor.controls.forEach(e => e.remove());
	editor.controls = [];
	editor.params = [];
}

export async function loadPieces(html) {
	let pieces = {}, repo, namespace, lang;
	html.querySelectorAll('meta').forEach(e => {
		repo = repo || e.dataset.repo;
		namespace = namespace || e.dataset.namespace;
	});
	if (!repo || !namespace) {
		console.error("Missing metadata in piece list");
		return pieces;
	}
	html.querySelectorAll('[data-icon]').forEach(e => {
		e.style.setProperty('--icon', `url('https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/textures/spell/${e.dataset.icon}.png')`);
	});
	try {
		lang = await loadJSON(`https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/lang/en_us.json`);
	} catch {}
	lang = lang || {};
	html.querySelectorAll('.piece').forEach(e => {
		if (repo && namespace) {
			e.style.setProperty('--piece-icon', `url('https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/textures/spell/${e.dataset.icon || e.dataset.type}.png')`);
		}
		e.dataset.name = e.dataset.name || lang[`${namespace}.spellpiece.${e.dataset.type}`] || `${namespace}.spellpiece.${e.dataset.type}`;
		e.dataset.desc = e.dataset.desc || lang[`${namespace}.spellpiece.${e.dataset.type}.desc`] || `${namespace}.spellpiece.${e.dataset.type}.desc`;
		e.dataset.key = e.dataset.key || `${namespace}:${e.dataset.type}`;
		e.dataset.sortingName = e.dataset.sortingName || e.dataset.name;
		pieces[e.dataset.type] = e;
	});
	return pieces;
}

export function exportPiece(piece) {
	let params = {};
	let hasParams = false;
	piece.querySelectorAll('.param').forEach(param => {
		params[param.dataset.key] = sideToInt(param.dataset.side);
		hasParams = true;
	});
	let res = { key: piece.dataset.key };
	// TODO comment
	if (hasParams) res.params = params;
	if (piece.dataset.key == 'psi:constant_number') {
		res.constantValue = piece.querySelector('[data-value]').textContent;
	}
	return res;
}

function sideToInt(side) {
	return { off: 0, top: 1, bottom: 2, left: 3, right: 4 }[side || 'off'];
}

export function oppositeSide(side) {
	return { left: 'right', right: 'left', top: 'bottom', bottom: 'top', off: 'off' }[side];
}

export function pieceInterceptKey(ch, selected) {
	if (!selected.cell || !selected.cell.piece) return false;
	let piece = selected.cell.piece;
	if (piece.dataset.key == 'psi:constant_number') {
		// Phi style number constant editing
		if ("FDfd".includes(ch)) return false;
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
		return true;
	}
	return false;
}
