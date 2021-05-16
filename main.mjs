import { createGrid, selectCell, exportGrid } from './grid.mjs';
import { setPiece, removePiece, createPiece, setParamSide, getParamSide, isParamOptional, getSortingName, createEditor, loadPieces } from './piece.mjs';
import { loadHTML, bound } from './util.mjs';

const size = 9;
const width = size, height = size;
const grid = document.querySelector('#spell-grid');
let selected = {};
let editor = { element: document.querySelector('#piece-config'), controls: [], params: [] };
let cells = createGrid(grid, width, height, editor, selected);
selectCell(cells, selected, 4, 4);

const pieceList = document.querySelector('#piece-catalog');
let pieces = {};
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

document.querySelector('#search').addEventListener('input', () => {
	rebuildCatalog();
});

let side;
document.addEventListener('keydown', e => {
	if (e.target.nodeName == 'INPUT') return;
	if ('Escape' == e.key) repeat = 0;
	if (['Delete', 'Backspace'].includes(e.key)) {
		removePiece(selected.cell);
		createEditor(editor, selected);
		repeat = 0;
	}
	if ('123456789'.includes(e.key)) side = e.key;
	let param = editor.params[side - 1];
	if (param) {
		if (e.key == 'ArrowLeft') setParamSide(param, getParamSide(param) == 'left' && isParamOptional(param) ? 'off' : 'left', selected, editor);
		if (e.key == 'ArrowRight') setParamSide(param, getParamSide(param) == 'right' && isParamOptional(param) ? 'off' : 'right', selected, editor);
		if (e.key == 'ArrowUp') setParamSide(param, getParamSide(param) == 'top' && isParamOptional(param) ? 'off' : 'top', selected, editor);
		if (e.key == 'ArrowDown') setParamSide(param, getParamSide(param) == 'bottom' && isParamOptional(param) ? 'off' : 'bottom', selected, editor);
		return;
	}
	let x = selected.x, y = selected.y;
	if (e.key == 'ArrowLeft') x--;
	if (e.key == 'ArrowRight') x++;
	if (e.key == 'ArrowUp') y--;
	if (e.key == 'ArrowDown') y++;
	selectCell(cells, selected, bound(x, width), bound(y, height), editor);
	if (e.key == 'e') alert(JSON.stringify(exportGrid(cells)));
});
document.addEventListener('keyup', e => {
	if ('123456789'.includes(e.key)) side = null;
});
document.addEventListener('contextmenu', e => e.preventDefault());
