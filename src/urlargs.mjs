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
		let [, version, data] = spell.match(/^(?:([0-9]+)-)?(.*)$/);
		switch (version) {
		case '1':
			// WASM powered zstd + binary encoding
			console.log(urlSafeToSpell(data));
			importGrid(urlSafeToSpell(data), cells);
			break;
		case undefined:
			// Base64 encoded SNBT
			importGrid(snbtToSpell(decodeURIComponent(atob(data))), cells);
			break;
		}
		createEditor(editor, selected);
	}
}

export function updateURLArgs(imported = false) {
	if (cells.some(col => col.some(cell => cell.piece))) {
		let args = new URLSearchParams();
		if (!imported) args.set('cursor', `${selected.x + 1}-${selected.y + 1}`);
		args.set('spell', '1-' + spellToUrlSafe(exportGrid(cells)));
		history.replaceState({}, '', `${location.pathname}?${args}`);
	} else {
		history.replaceState({}, '', location.pathname);
	}
}
