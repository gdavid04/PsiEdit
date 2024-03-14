import { createGrid, selectCell, exportGrid, importGrid } from './grid.mjs';
import { setPiece, removePiece, createPiece, setParamSide, getParamSide, isParamOptional, getSortingName, createEditor, loadPieces, oppositeSide, pieceInterceptKey } from './piece.mjs';
import { addAddonArg, parseURLArgs, removeAddonArg, updateURLArgs } from './urlargs.mjs';
import { loadHTML, bound, inBound } from './util.mjs';

import init from 'psi-spell-encode-wasm/psi_spell_encode_wasm';
import wasmUrl from 'psi-spell-encode-wasm/psi_spell_encode_wasm_bg.wasm?url';
import { snbtToSpell } from 'psi-spell-encode-wasm';

const size = 9;
export const width = size, height = size;
const grid = document.querySelector('#spell-grid');
export const nameField = document.querySelector('#spell-name');
const search = document.querySelector('#search');
const exportButton = document.querySelector('#export');
const importButton = document.querySelector('#import');
const deleteButton = document.querySelector('#delete');
const addonsButton = document.querySelector('#sources');
export let selected = {};
export let editor = { element: document.querySelector('#piece-config'), controls: [], params: [], comment: null };
export let cells = createGrid(grid, width, height, editor, selected);
export let spellData = { spellName: '', modsRequired: [] };
selectCell(cells, selected, 4, 4);

const pieceList = document.querySelector('#piece-catalog');
const pieceSourcesDialog = document.querySelector('.piece-sources').parentElement;
const sourceList = document.querySelector('#source-list');
const addSourceButton = document.querySelector('#add-source');
const sourceURL = document.querySelector('#source-url');
pieceSourcesDialog.addEventListener('click', e => {
	if (e.target == pieceSourcesDialog) pieceSourcesDialog.hidden = true;
});
document.querySelector('#close-sources').addEventListener('click', () => pieceSourcesDialog.hidden = true);
addonsButton.addEventListener('click', () => pieceSourcesDialog.hidden = false);

export let pieces = {};
export let pieceSources = {};
import { spellToSnbt } from 'psi-spell-encode-wasm';
const builtinSources = ['psi'].reduce((obj, list) => (obj[list] = 'pieces/' + list + '.html', obj), {});
const loads = Promise.all([init(wasmUrl), ...Object.values(builtinSources)
	.map(url => addPieceSource(url, true))]);

parseURLArgs(loads);

async function loadPieceDesc(url) {
	let desc = await loadHTML(url);
	let loaded = await loadPieces(desc);
	return loaded;
}

addSourceButton.addEventListener('click', () => addPieceSource(sourceURL.value));
sourceURL.addEventListener('keydown', e => {
	if (e.key == 'Enter') {
		addPieceSource(sourceURL.value);
		e.preventDefault();
	}
});

export async function addPieceSource(url, builtin = false, urlArg = false) {
	let pieces = await loadPieceDesc(url);
	if (pieceSources[pieces.namespace]) removePieceSource(pieces.namespace, true, urlArg);
	let item = sourceList.div('source-item', 'horizontal', 'vcenter-items', ...builtin ? ['builtin'] : []);
	item.dataset.tooltip = `Repo: ${pieces.repo}\nBranch: ${pieces.branch}`;
	if (builtin) item.dataset.tooltip += '\nBuilt-in';
	let name = item.div('source-name');
	name.textContent = pieces.namespace;
	if (!builtin) {
		let link = item.div('source-link');
		link.textContent = url;
	}
	let count = item.div('source-count', 'flex-grow');
	count.textContent = Object.keys(pieces.pieces).length;
	// let reload = item.button('source-reload');
	// reload.dataset.tooltip = 'Reload';
	// reload.i('fa-solid', 'fa-sync');
	// reload.addEventListener('click', () => addPieceSource(url, builtin));
	if (!builtin) {
		let remove = item.button('source-remove');
		remove.dataset.tooltip = builtinSources[pieces.namespace] ? 'Restore built-in' : 'Remove';
		remove.i('fa-solid', builtinSources[pieces.namespace] ? 'fa-undo' : 'fa-minus');
		remove.addEventListener('click', () => removePieceSource(pieces.namespace));
		if (!urlArg) addAddonArg(url);
	}
	pieceSources[pieces.namespace] = {
		item: item,
		url: url,
		pieces: pieces.pieces
	};
	reorderSources();
	rebuildCatalog();
}

function reorderSources() {
	for (let [, { item }] of Object.entries(pieceSources).sort(([a], [b]) => a > b)) {
		sourceList.appendChild(item);
	}
	for (let namespace of Object.keys(builtinSources).sort()) {
		if (pieceSources[namespace]) sourceList.insertBefore(pieceSources[namespace].item, sourceList.firstChild);
	}
}

function removePieceSource(namespace, replacing = false, urlArg = false) {
	pieceSources[namespace].item.remove();
	if (!urlArg) removeAddonArg(pieceSources[namespace].url);
	delete pieceSources[namespace];
	if (builtinSources[namespace] && !replacing) {
		addPieceSource(builtinSources[namespace], true, urlArg);
	}
	rebuildCatalog();
}

function rebuildCatalog() {
	pieces = Object.assign({}, ...Object.values(pieceSources).map(source => source.pieces));
	pieceList.innerHTML = '';
	Object.values(pieces).sort((a, b) => getSortingName(a) > getSortingName(b)).forEach(piece => {
		let item = pieceList.div('catalog-item');
		item.append(piece.cloneNode(true));
		item.addEventListener('click', () => {
			setPiece(selected.cell, createPiece(piece));
			createEditor(editor, selected);
		});
	});
}

function filterCatalog() {
	let query = search.value.toLowerCase();
	pieceList.childNodes.forEach(item => {
		let piece = item.querySelector('.piece');
		item.hidden = !piece.dataset.name.toLowerCase().includes(query);
	});
}

function exportSpell() {
	prompt('Export Spell SNBT', spellToSnbt(exportGrid(cells))); // TODO proper dialog
	updateURLArgs();
}

function importSpell() {
	importGrid(snbtToSpell(prompt('Import Spell SNBT')), cells); // TODO proper dialog
	updateURLArgs(true);
	createEditor(editor, selected);
}

function deletePiece() {
	removePiece(selected.cell);
	createEditor(editor, selected);
}

nameField.addEventListener('input', () => spellData.spellName = nameField.value);
search.addEventListener('input', filterCatalog);
exportButton.addEventListener('click', exportSpell);
importButton.addEventListener('click', importSpell);
deleteButton.addEventListener('click', deletePiece);

export let side;
document.addEventListener('keydown', e => {
	if (e.getModifierState('Control') && e.key == 'd') {
		e.preventDefault();
		if (editor.comment) {
			if (e.target == editor.comment) document.activeElement.blur();
			else editor.comment.focus();
		}
	}
	if (['INPUT', 'TEXTAREA'].includes(e.target.nodeName)) {
		if (e.key == { INPUT: 'Enter', TEXTAREA: 'Escape' }[e.target.nodeName]) {
			e.preventDefault();
			document.activeElement.blur();
		}
		return;
	}
	if (e.key == 'Enter') {
		search.focus();
		search.select();
		return;
	}
	if (pieceInterceptKey(e.key, selected, editor)) return;
	if (['Delete', 'Backspace'].includes(e.key)) deletePiece();
	if ('123456789'.includes(e.key)) {
		if (editor.params[side - 1]) editor.paramControls[side - 1].classList.toggle('editing', false);
		side = e.key;
	}
	let param = editor.params[side - 1];
	if (param) {
		editor.paramControls[side - 1].classList.toggle('editing', true);
		if (e.key == 'ArrowLeft') setParamSide(param, getParamSide(param) == 'left' && isParamOptional(param) ? 'off' : 'left', selected, editor);
		if (e.key == 'ArrowRight') setParamSide(param, getParamSide(param) == 'right' && isParamOptional(param) ? 'off' : 'right', selected, editor);
		if (e.key == 'ArrowUp') setParamSide(param, getParamSide(param) == 'top' && isParamOptional(param) ? 'off' : 'top', selected, editor);
		if (e.key == 'ArrowDown') setParamSide(param, getParamSide(param) == 'bottom' && isParamOptional(param) ? 'off' : 'bottom', selected, editor);
		return;
	}
	let x = selected.x, y = selected.y, direction = 'off';
	if (e.key == 'ArrowLeft') { x--; direction = 'left'; }
	if (e.key == 'ArrowRight') { x++; direction = 'right'; }
	if (e.key == 'ArrowUp') { y--; direction = 'top'; }
	if (e.key == 'ArrowDown') { y++; direction = 'bottom'; }
	if (e.shiftKey && inBound(x, width) && inBound(y, height) && direction != 'off' && !cells[x][y].piece) {
		let connector = createPiece(pieces['psi:connector']);
		setParamSide(connector.querySelector('.param[data-key=_target]'), oppositeSide(direction));
		setPiece(cells[x][y], connector);
	}
	selectCell(cells, selected, bound(x, width), bound(y, height), editor);
	if (e.key == 'e') exportSpell();
	if (e.key == 'i') importSpell();
});
document.addEventListener('keyup', e => {
	if ('123456789'.includes(e.key)) {
		side = null;
		editor.paramControls.forEach(p => p.classList.toggle('editing', false));
	}
});

document.addEventListener('contextmenu', e => e.preventDefault());
