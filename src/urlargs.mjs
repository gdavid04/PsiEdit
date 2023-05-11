import { exportGrid, importGrid } from './grid.mjs';
import { createEditor } from './piece.mjs';
import { selected, editor, cells, width, height } from './main.mjs';
import { selectCell } from './grid.mjs';
import { bound } from './util.mjs';
import { decompress } from './lzw.mjs';
import { spellToUrlSafe, snbtToSpell, urlSafeToSpell } from 'psi-spell-encode-wasm';

export function parseURLArgs() {
	let args = new URLSearchParams(location.search);
	if (args.has('cursor')) {
		let [x, y] = args.get('cursor').split(/-?/).map(a => parseInt(a) - 1);
		selectCell(cells, selected, bound(x, width), bound(y, height));
	}
	if (args.has('spell')) {
		let spell = args.get('spell');
		let match = spell.match(/^([LG])?(?:([0-9]+)-)?(.*)$/);
		let type = match[1];
		let version = match[2];
		let data = match[3];
		if (version == 1) {
			// PsiEdit format v1 compressed spell data
			switch (type) {
			case 'L':
				// LZW (Old)
				data = match[3].replaceAll('_', '/').replaceAll('.', '+'); // base64 encoded
				if (data.length % 4 == 1) data += '='; // add padding
				else if (data.length % 4 == 2) data += '==';
				importGrid(new Uint8Array([...decompress(atob(data))].map(c => c.charCodeAt())), cells);
				break;
			case 'G':
				// WASM powered gzip + binary encoding
				importGrid(urlSafeToSpell(data), cells);
				break;
			}
		} else if (version == 2) {
			importGrid(urlSafeToSpell(match[3]), cells);
		} else {
			if (type == 'L') data = decompress(atob(data)); // LZW compressed spell data
			importGrid(snbtToSpell(decodeURIComponent(atob(data))), cells);
		}
		createEditor(editor, selected);
	}
}

export function updateURLArgs() {
	if (cells.some(col => col.some(cell => cell.piece))) {
		let args = new URLSearchParams();
		args.set('cursor', `${selected.x + 1}-${selected.y + 1}`);
		args.set('spell', 'G1-' + spellToUrlSafe(exportGrid(cells, false)));
		history.replaceState({}, '', `${location.pathname}?${args}`);
	} else {
		history.replaceState({}, '', location.pathname);
	}
}
