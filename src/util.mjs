export function appendElem(parent, tag, ...classes) {
	let elem = document.createElement(tag);
	elem.classList.add(...classes);
	parent.append(elem);
	return elem;
}

function elemFn(tag) {
	Node.prototype[tag] = function(...classes) {
		return appendElem(this, tag, ...classes);
	};
}

elemFn('div');
elemFn('button');
elemFn('i');

export async function loadHTML(url) {
	let text = await fetch(url).then(r => r.text());
	return new DOMParser().parseFromString(text, 'text/html');
}

export async function loadJSON(url) {
	return fetch(url).then(r => r.json());
}

export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

export function bound(index, size) {
	return clamp(index, 0, size - 1);
}

export function inBound(index, size) {
	return index >= 0 && index < size;
}
