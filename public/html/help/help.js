'use strict';

const helpElements = document.querySelectorAll('div[data-help-src]');

for (const helpElement of helpElements) {
	helpElement.classList.add('help-collapsed');

	helpElement.addEventListener('click', async e => {
		if (e.target.classList.contains('help-header')) {
			if (helpElement.getAttribute('data-help-loaded') === null) {
				helpElement.classList.remove('help-collapsed');

				const infoElement = document.createElement('iframe');

				infoElement.src = helpElement.getAttribute('data-help-src');
				infoElement.classList.add('help-content');

				helpElement.appendChild(infoElement);
				helpElement.setAttribute('data-help-loaded', '');
			} else {
				helpElement.classList.toggle('help-collapsed');
			}
		}
	});
}

