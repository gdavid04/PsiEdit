import { setPiece } from './piece.mjs';
import { removePiece, createEditor, exportPiece, importPiece } from './piece.mjs';
import './util.mjs';
import { nameField, spellData } from './main.mjs';

export function createGrid(grid, width, height, editor = null, selected = null) {
	let cells = [];
	for (let x = 0; x < width; x++) {
		cells[x] = [];
		for (let y = 0; y < height; y++) {
			cells[x][y] = createCell(grid, cells, x, y, editor, selected);
		}
	}
	cells.width = width;
	cells.height = height;
	return cells;
}

function createCell(grid, cells, x, y, editor = null, selected = null) {
	let cell = { element: grid.div('cell'), piece: null };
	if (editor) {
		cell.element.addEventListener('mousedown', e => {
			if (e.button == 0) {
				selectCell(cells, selected, x, y, editor);
			} else if (e.button == 2) {
				removePiece(cell);
				createEditor(editor, selected);
			}
		});
		['top', 'bottom'].forEach(tb => ['left', 'right'].forEach(lr =>
			cell.element.div('selection', tb, lr)));
	}
	return cell;
}

export function selectCell(cells, selected, x, y, editor = null) {
	if (selected.x == x && selected.y == y) return;
	if (selected.cell) selected.cell.element.classList.remove('selected');
	selected.x = x; selected.y = y;
	selected.cell = cells[x][y];
	selected.cell.element.classList.add('selected');
	if (editor) createEditor(editor, selected);
}

export function exportGrid(cells) {
	// compact is used for URL export to save space
	let res = [];
	let masks = new Uint8Array(Math.ceil(cells.width * cells.height / 8));
	let mask = 0;
	let i = 0;
	for (let x = 0; x < cells.width; x++) {
		for (let y = 0; y < cells.height; y++) {
			mask = (mask << 1) & 0xFF;
			if (cells[x][y].piece) {
				mask |= 1;
				let pieceData = exportPiece(cells[x][y].piece);
				res.push({ x: x, y: y, data: pieceData });
			}
			if (++i % 8 == 0) masks.set([mask], i / 8 - 1);
		}
	}
	if (i % 8 != 0) masks.set([mask], i / 8);
	return {
		modsRequired: spellData.modsRequired, // TODO: Add mods to list when using their pieces.
		validSpell: true,
		spellName: spellData.spellName,
		spellList: res
	};
}

export function importGrid(from, cells) {
	for (let x = 0; x < cells.width; x++) {
		for (let y = 0; y < cells.height; y++) {
			removePiece(cells[x][y]);
		}
	}
	// TODO validation and error messages
	spellData.modsRequired = from.modsRequired;
	spellData.spellName = from.spellName;
	nameField.value = from.spellName;
	for (let pieceData of from.spellList) {
		setPiece(cells[pieceData.x][pieceData.y], importPiece(pieceData.data));
	}
}
