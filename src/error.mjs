const errorDialog = document.querySelector('.error-popup').parentElement;
document.querySelector('#close-error').addEventListener('click', () => errorDialog.hidden = true);
const errorText = document.querySelector('#error-message');

export function showError(message) {
	errorText.textContent = message;
	errorDialog.hidden = false;
}
