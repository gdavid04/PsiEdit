import { setPiece } from './piece.mjs';
import { removePiece, createEditor, exportPiece, importPiece } from './piece.mjs';
import './util.mjs';

let spellName = 'PsiEdit';
let modsRequired = [];

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

export function exportGrid(cells, compact = false) {
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
				let pieceData = exportPiece(cells[x][y].piece, compact);
				if (compact) {
					if (pieceData.length > 0xFFFF) throw new Error('Piece data too large');
					res.push(new Uint8Array([
						(pieceData.length >> 0) & 0xFF,
						(pieceData.length >> 8) & 0xFF
					]));
					res.push(pieceData);
				}
				else res.push({ x: x, y: y, data: pieceData });
			}
			if (++i % 8 == 0) masks.set([mask], i / 8 - 1);
		}
	}
	if (i % 8 != 0) masks.set([mask], i / 8);
	if (compact) {
		let raw = new Uint8Array(masks.length + res.map(e => e.length).reduce((a, b) => a + b));
		raw.set(masks, 0);
		let offset = masks.length;
		for (let pieceData of res) {
			raw.set(pieceData, offset);
			offset += pieceData.length;
		}
		return raw;
	} else return {
		'modsRequired': modsRequired, // TODO: Add mods to list when using their pieces.
		'validSpell': true,
		'spellName': spellName,
		'spellList': res
	};
}

export function importGrid(from, cells) {
	for (let x = 0; x < cells.width; x++) {
		for (let y = 0; y < cells.height; y++) {
			removePiece(cells[x][y]);
		}
	}
	if (from instanceof Uint8Array) {
		let masks = from.subarray(0, Math.ceil(cells.width * cells.height / 8));
		let i = 0;
		let offset = masks.length;
		for (let x = 0; x < cells.width; x++) {
			for (let y = 0; y < cells.height; y++) {
				if ((masks[Math.floor(i / 8)] >> (7 - i % 8)) & 1) {
					let length = (from[offset + 0] << 0) | (from[offset + 1] << 8);
					let piece = importPiece(from.subarray(offset + 2, offset + length + 2));
					setPiece(cells[x][y], piece);
					offset += length + 2;
				}
				i++;
			}
		}
	} else {
		// TODO validation and error messages
		modsRequired = from.modsRequired;
		spellName = from.spellName;
		for (let pieceData of from.spellList) {
			setPiece(cells[pieceData.x][pieceData.y], importPiece(pieceData.data));
		}
	}
}
