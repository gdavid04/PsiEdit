import { createGrid, selectCell, exportGrid, importGrid } from './grid.mjs';
import { setPiece, removePiece, createPiece, setParamSide, getParamSide, isParamOptional, getSortingName, createEditor, loadPieces, oppositeSide, pieceInterceptKey } from './piece.mjs';
import { loadHTML, bound, inBound } from './util.mjs';

const size = 9;
const width = size, height = size;
const grid = document.querySelector('#spell-grid');
const search = document.querySelector('#search');
const exportButton = document.querySelector('#export');
const importButton = document.querySelector('#import');
const deleteButton = document.querySelector('#delete');
let selected = {};
let editor = { element: document.querySelector('#piece-config'), controls: [], params: [] };
let cells = createGrid(grid, width, height, editor, selected);
selectCell(cells, selected, 4, 4);

const pieceList = document.querySelector('#piece-catalog');
export let pieces = {};
loadPieceDesc('pieces/psi.html');
loadPieceDesc('pieces/phi.html');

async function loadPieceDesc(url) {
	loadHTML(url).then(r => loadPieces(r).then(pcs => {
		Object.assign(pieces, pcs);
		rebuildCatalog();
	}));
}

function rebuildCatalog() {
	pieceList.innerHTML = '';
	Object.values(pieces).sort((a, b) => getSortingName(a) > getSortingName(b)).forEach(piece => {
		if (!piece.dataset.name.toLowerCase().includes(document.querySelector('#search').value.toLowerCase())) return;
		let item = pieceList.div('catalog-item');
		item.append(piece.cloneNode(true));
		item.addEventListener('click', () => {
			setPiece(selected.cell, createPiece(piece));
			createEditor(editor, selected);
		});
	});
}

function exportSpell() {
	alert(JSON.stringify(exportGrid(cells))); // TODO proper dialog
}

function importSpell() {
	importGrid(JSON.parse(prompt("Spell JSON")), cells); // TODO proper dialog
	createEditor(editor, selected);
}

function deletePiece() {
	removePiece(selected.cell);
	createEditor(editor, selected);
}

search.addEventListener('input', rebuildCatalog);
exportButton.addEventListener('click', exportSpell);
importButton.addEventListener('click', importSpell);
deleteButton.addEventListener('click', deletePiece);

let side;
document.addEventListener('keydown', e => {
	if (e.target.nodeName == 'INPUT') {
		if (e.key == 'Enter') document.activeElement.blur();
		return;
	}
	if (e.key == 'Enter') {
		search.focus();
		search.select();
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
