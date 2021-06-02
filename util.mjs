export function div(...classes) {
	let elem = document.createElement('div');
	elem.classList.add(...classes);
	return elem;
}
Node.prototype.div = function(...classes) {
	let elem = div(...classes);
	this.append(elem);
	return elem;
}

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
