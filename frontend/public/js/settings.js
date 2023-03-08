'use strict';

import notify from '/js/notifications.js';


const httpsCheckbox = document.querySelector('#https-checkbox');
const redirectCheckbox = document.querySelector('#redirect-checkbox');
const redirectLabel = document.querySelector('#redirect-label');
const certFileInput = document.querySelector('#cert-file-input');
const keyFileInput = document.querySelector('#key-file-input');


httpsCheckbox.addEventListener('click', e => {
	if (!httpsCheckbox.checked) {
		redirectCheckbox.checked = false;
	}
});


redirectCheckbox.addEventListener('click', async e => {
	const text = redirectLabel.innerText;

	if (redirectCheckbox.checked) {
		e.preventDefault();
		redirectCheckbox.setAttribute('disabled', true);
		redirectLabel.innerText = 'Checking HTTPS...';

		fetch(window.location.href
				.replace(/https?/, 'https'), {mode: 'no-cors'})
				.then(res => {
					redirectCheckbox.checked = true;
					redirectCheckbox.removeAttribute('disabled');
					redirectLabel.innerText = text;
				})
				.catch(err => {
					redirectLabel.innerText = 'HTTPS redirect unavailable';
					notify.tell('Unable to use HTTPS',
							'Siter is unavailable over HTTPS. If you try to enable ' +
							'this mode anyway, you will lose access to Siter!',
							'danger');
				});
	}
});


fetch('/settings/security/').then(async res => {
	const options = await res.json();

	httpsCheckbox.checked = options.httpsEnabled;
	redirectCheckbox.checked = options.httpsRedirect;
	certFileInput.value = options.certFile || '';
	keyFileInput.value = options.keyFile || '';
});

