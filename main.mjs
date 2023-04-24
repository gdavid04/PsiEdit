import { createGrid, selectCell, exportGrid, importGrid } from './grid.mjs';
import { setPiece, removePiece, createPiece, setParamSide, getParamSide, isParamOptional, getSortingName, createEditor, loadPieces, oppositeSide, pieceInterceptKey } from './piece.mjs';
import { snbt2json } from './snbt.mjs';
import { parseURLArgs, updateURLArgs } from './urlargs.mjs';
import { loadHTML, bound, inBound } from './util.mjs';

const size = 9;
export const width = size, height = size;
const grid = document.querySelector('#spell-grid');
const search = document.querySelector('#search');
const exportButton = document.querySelector('#export');
const importButton = document.querySelector('#import');
const deleteButton = document.querySelector('#delete');
export let selected = {};
export let editor = { element: document.querySelector('#piece-config'), controls: [], params: [], comment: null };
export let cells = createGrid(grid, width, height, editor, selected);
selectCell(cells, selected, 4, 4);

const pieceList = document.querySelector('#piece-catalog');
export let pieces = {};
await Promise.allSettled([
	'pieces/psi.html',
	'pieces/phi.html'
].map(loadPieceDesc));

parseURLArgs();

async function loadPieceDesc(url) {
	let desc = await loadHTML(url);
	let loaded = await loadPieces(desc);
	Object.assign(pieces, loaded);
	rebuildCatalog();
}

function rebuildCatalog() {
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
	alert(JSON.stringify(exportGrid(cells))); // TODO proper dialog
	updateURLArgs();
}

function importSpell() {
	importGrid(snbt2json(prompt("Spell JSON")), cells); // TODO proper dialog
	createEditor(editor, selected);
}

function deletePiece() {
	removePiece(selected.cell);
	createEditor(editor, selected);
}

search.addEventListener('input', filterCatalog);
exportButton.addEventListener('click', exportSpell);
importButton.addEventListener('click', importSpell);
deleteButton.addEventListener('click', deletePiece);

let side;
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
	if ('123456789'.includes(e.key)) side = e.key;
	let param = editor.params[side - 1];
	if (param) {
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
	if ('123456789'.includes(e.key)) side = null;
});

document.addEventListener('contextmenu', e => e.preventDefault());
