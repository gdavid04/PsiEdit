import { exportGrid, importGrid } from './grid.mjs';
import { createEditor } from './piece.mjs';
import { selected, editor, cells, pieces, width, height } from './main.mjs';
import { selectCell } from './grid.mjs';
import { bound } from './util.mjs';

export function parseURLArgs() {
	let args = new URLSearchParams(location.search);
	if (args.has('cursor')) {
		let [x, y] = args.get('cursor').split(/-?/).map(a => parseInt(a) - 1);
		selectCell(cells, selected, bound(x, width), bound(y, height));
	}
	if (args.has('spell')) {
		if (args.get('spell').startsWith('1-')) {
			// base64 encoded PsiEdit format v1 compressed spell data
			importGrid(new Uint8Array([...atob(args.get('spell').substring(2))].map(c => c.charCodeAt())), cells);
		} else {
			// base64 encoded spell JSON
			importGrid(JSON.parse(decodeURIComponent(atob(args.get('spell')))), cells);
		}
		createEditor(editor, selected);
	}
}

export function updateURLArgs() {
	if (cells.some(col => col.some(cell => cell.piece))) {
		let args = new URLSearchParams();
		args.set('cursor', `${selected.x + 1}-${selected.y + 1}`);
		args.set('spell', '1-' + btoa(String.fromCharCode.apply(null, exportGrid(cells, true))));
		history.replaceState({}, '', `${location.pathname}?${args}`);
	} else {
		history.replaceState({}, '', location.pathname);
	}
}
