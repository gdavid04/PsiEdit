import { exportGrid, importGrid } from './grid.mjs';
import { createEditor } from './piece.mjs';
import { selected, editor, cells, width, height } from './main.mjs';
import { selectCell } from './grid.mjs';
import { bound } from './util.mjs';
import { snbt2json } from './snbt.mjs';
import { compress, decompress } from './lzw.mjs';

export function parseURLArgs() {
	let args = new URLSearchParams(location.search);
	if (args.has('cursor')) {
		let [x, y] = args.get('cursor').split(/-?/).map(a => parseInt(a) - 1);
		selectCell(cells, selected, bound(x, width), bound(y, height));
	}
	if (args.has('spell')) {
		let spell = args.get('spell');
		let match = spell.match(/^(L)?(?:([0-9]+)-)?(.*)$/);
		let version = match[2];
		let data = match[3].replaceAll('_', '/').replaceAll('.', '+'); // base64 encoded
		if (data.length % 4 == 1) data += '='; // add padding
		else if (data.length % 4 == 2) data += '==';
		data = atob(data);
		if (match[1]) data = decompress(data); // LZW compressed spell data
		if (version == 1) {
			// PsiEdit format v1 compressed spell data
			importGrid(new Uint8Array([...data].map(c => c.charCodeAt())), cells);
		} else {
			// spell JSON or SNBT
			importGrid(snbt2json(decodeURIComponent(data)), cells);
		}
		createEditor(editor, selected);
	}
}

export function updateURLArgs() {
	if (cells.some(col => col.some(cell => cell.piece))) {
		let args = new URLSearchParams();
		args.set('cursor', `${selected.x + 1}-${selected.y + 1}`);
		// base64 encoded LZW compressed PsiEdit format v1 compressed spell data
		args.set('spell', 'L1-' + btoa(compress(String.fromCharCode.apply(null, exportGrid(cells, true)))).replaceAll('/', '_').replaceAll('+', '.').replace(/=+$/, ''));
		history.replaceState({}, '', `${location.pathname}?${args}`);
	} else {
		history.replaceState({}, '', location.pathname);
	}
}
