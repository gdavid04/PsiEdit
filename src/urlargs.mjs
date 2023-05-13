import { exportGrid, importGrid } from './grid.mjs';
import { createEditor } from './piece.mjs';
import { selected, editor, cells, width, height } from './main.mjs';
import { selectCell } from './grid.mjs';
import { bound } from './util.mjs';
import { snbtToSpell, urlSafeToSpell, spellToUrlSafe } from 'psi-spell-encode-wasm';

export function parseURLArgs() {
	let args = new URLSearchParams(location.search);
	if (args.has('cursor')) {
		let [x, y] = args.get('cursor').split(/-?/).map(a => parseInt(a) - 1);
		selectCell(cells, selected, bound(x, width), bound(y, height));
	}
	if (args.has('spell')) {
		let spell = args.get('spell');
		let match = spell.match(/^([LGZ])?(?:([0-9]+)-)?(.*)$/);
		let type = match[1];
		let version = match[2];
		let data = match[3];
		switch (type) {
		case 'Z':
			// WASM powered zstd + binary encoding
			switch (version) {
			case '1':
				importGrid(urlSafeToSpell(data), cells);
			}
			break;
		default:
			// Uncompressed spell JSON or SNBT
			importGrid(snbtToSpell(decodeURIComponent(data)), cells);
		}
		createEditor(editor, selected);
	}
}

export function updateURLArgs() {
	if (cells.some(col => col.some(cell => cell.piece))) {
		let args = new URLSearchParams();
		args.set('cursor', `${selected.x + 1}-${selected.y + 1}`);
		args.set('spell', 'Z1-' + spellToUrlSafe(exportGrid(cells, false)));
		history.replaceState({}, '', `${location.pathname}?${args}`);
	} else {
		history.replaceState({}, '', location.pathname);
	}
}
