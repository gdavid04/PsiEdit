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
	if (repo && namespace) {
		html.querySelectorAll('[data-icon]').forEach(e => {
			e.style.setProperty('--icon', `url('https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/textures/spell/${e.dataset.icon}.png')`);
		});
	}
	try {
		lang = await loadJSON(`https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/lang/en_us.json`);
	} catch {}
	html.querySelectorAll('.piece').forEach(e => {
		if (repo && namespace) {
			e.style.setProperty('--piece-icon', `url('https://raw.githubusercontent.com/${repo}/master/src/main/resources/assets/${namespace}/textures/spell/${e.dataset.icon || e.dataset.type}.png')`);
		}
		if (lang) {
			e.dataset.name = e.dataset.name || lang[`${namespace}.spellpiece.${e.dataset.type}`];
			e.dataset.desc = e.dataset.desc || lang[`${namespace}.spellpiece.${e.dataset.type}.desc`];
		}
		if (namespace) {
			e.dataset.key = e.dataset.key || `${namespace}:${e.dataset.type}`;
			e.dataset.sortingName = e.dataset.sortingName || `${namespace}.spellpiece.${e.dataset.type}`;
		}
		pieces[e.dataset.type] = e;
	});
	return pieces;
}

export function exportPiece(piece) {
	let params = {};
	piece.querySelectorAll('.param').forEach(param => {
		params[param.dataset.key] = sideToInt(param.dataset.side);
	});
	return {
		// TODO comment
		key: piece.dataset.key,
		params: params
	};
}

function sideToInt(side) {
	return { off: 0, top: 1, bottom: 2, left: 3, right: 4 }[side || 'off'];
}

export function oppositeSide(side) {
	return { left: 'right', right: 'left', top: 'bottom', bottom: 'top', off: 'off' }[side];
}
