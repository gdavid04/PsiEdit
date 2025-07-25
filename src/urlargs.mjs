import { exportGrid, importGrid } from './grid.mjs';
import { createEditor } from './piece.mjs';
import { selected, editor, cells, width, height, addPieceSource } from './main.mjs';
import { selectCell } from './grid.mjs';
import { bound } from './util.mjs';
import { urlSafeToSpell as urlSafeToSpell2 } from 'psi-spell-encode-wasm';
import { snbtToSpell as snbtToSpell3, urlSafeToSpell as urlSafeToSpell3, spellToUrlSafe as spellToUrlSafe3 } from 'psi-spell-encode-wasm-v3';

export async function parseURLArgs(builtinLoads = Promise.resolve()) {
	let args = new URLSearchParams(location.search);
	if (args.has('cursor')) {
		let [x, y] = args.get('cursor').split(/-?/).map(a => parseInt(a) - 1);
		selectCell(cells, selected, bound(x, width), bound(y, height));
	}
	let sources = args.getAll('addon');
	await builtinLoads;
	if (sources.length) {
		for (let source of sources) await addPieceSource(source, false, true);
	}
	if (args.has('spell')) {
		let spell = args.get('spell');
		let [, version, data] = spell.match(/^(?:([0-9]+)-)?(.*)$/);
		let migrate = true;
		switch (version) {
		case '1':
			// WASM powered zstd + binary encoding (v2)
			importGrid(urlSafeToSpell2(data), cells);
			break;
		case '2':
			migrate = false;
			// WASM powered zstd + binary encoding (v3)
			importGrid(urlSafeToSpell3(data), cells);
			break;
		case undefined:
			// Base64 encoded SNBT
			importGrid(snbtToSpell3(decodeURIComponent(atob(data))), cells);
			break;
		}
		if (migrate) updateURLArgs(true);
		createEditor(editor, selected);
	}
}

export function updateURLArgs(imported = false) {
	if (cells.some(col => col.some(cell => cell.piece))) {
		let args = new URLSearchParams();
		if (!imported) args.set('cursor', `${selected.x + 1}-${selected.y + 1}`);
		args.set('spell', '2-' + spellToUrlSafe3(exportGrid(cells)));
		history.replaceState({}, '', `${location.pathname}?${args}`);
	} else {
		history.replaceState({}, '', location.pathname);
	}
}

export function addAddonArg(url) {
	let args = new URLSearchParams(location.search);
	args.append('addon', url);
	history.replaceState({}, '', `${location.pathname}?${args}`);
}

export function removeAddonArg(url) {
	let args = new URLSearchParams(location.search);
	args.delete('addon', url);
	history.replaceState({}, '', `${location.pathname}?${args}`);
}
