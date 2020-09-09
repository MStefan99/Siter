'use strict';


addEventListener('load', () => {
	const helpElements = document.querySelectorAll('div[data-help-src]');

	for (const helpElement of helpElements) {
		helpElement.addEventListener('click', async () => {
			if (helpElement.getAttribute('data-help-loaded') === null) {
				const res = await fetch(helpElement.getAttribute('data-help-src'));

				if (res.ok) {
					const infoElement = document.createElement('div');

					infoElement.innerHTML = await res.text();
					infoElement.classList.add('help-content');
					helpElement.appendChild(infoElement);
					helpElement.setAttribute('data-help-loaded', '');
				}
			} else {
				helpElement.classList.toggle('help-collapsed');
			}
		});
	}
});
