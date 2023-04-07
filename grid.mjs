import { setPiece } from './piece.mjs';
import { removePiece, createEditor, exportPiece, importPiece } from './piece.mjs';
import './util.mjs';

export function createGrid(grid, width, height, editor = null, selected = null) {
	let cells = [];
	for (let x = 0; x < width; x++) {
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
	let res = [];
	for (let x = 0; x < cells.width; x++) {
		for (let y = 0; y < cells.height; y++) {
			if (cells[x][y].piece) {
				res.push({
					x: x,
					y: y,
					data: exportPiece(cells[x][y].piece)
				});
			}
		}
	}
	return {
		modsRequired: [], // TODO required mods list, for now this is here to remove the compatibility warning on import
		validSpell: true,
		spellName: 'PsiEdit', // TODO custom name
		spellList: res
	};
}

export function importGrid(from, cells) {
	for (let x = 0; x < cells.width; x++) {
		for (let y = 0; y < cells.height; y++) {
			removePiece(cells[x][y]);
		}
	}
	// TODO validation and error messages
	for (let pieceData of from.spellList) {
		setPiece(cells[pieceData.x][pieceData.y], importPiece(pieceData.data));
	}
}
