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
		importGrid(JSON.parse(atob(args.get('spell'))), cells);
		createEditor(editor, selected);
	}
}

export function updateURLArgs() {
	if (cells.some(col => col.some(cell => cell.piece))) {
		let args = new URLSearchParams();
		args.set('cursor', `${selected.x + 1}-${selected.y + 1}`);
		args.set('spell', btoa(JSON.stringify(exportGrid(cells))));
		history.replaceState({}, '', `${location.pathname}?${args}`);
	} else {
		history.replaceState({}, '', location.pathname);
	}
}
