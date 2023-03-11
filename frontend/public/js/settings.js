'use strict';

import notify from '/js/notifications.js';


const passwordForm = document.getElementById('password-form');
const httpPortInput = document.getElementById('http-port-input');
const httpsPortInput = document.getElementById('https-port-input');
const secureCheckbox = document.getElementById('secure-checkbox');
const redirectCheckbox = document.getElementById('redirect-checkbox');
const redirectLabel = document.getElementById('redirect-label');
const certFileInput = document.getElementById('security-cert-input');
const keyFileInput = document.getElementById('security-key-input');


passwordForm.addEventListener('submit', e => {
	if (passwordForm.newPassword.value !== passwordForm.newPasswordRepeat.value) {
		notify.tell('Passwords do not match', 'Please check your passwords and try again');
		e.preventDefault();
	}
});

secureCheckbox.addEventListener('click', e => {
	if (!secureCheckbox.checked) {
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


fetch('/settings/network/').then(async res => {
	const options = await res.json();

	httpPortInput.value = options.httpPort || 80;
	httpsPortInput.value = options.httpsPort || 443;
	secureCheckbox.checked = options.httpsEnabled;
	redirectCheckbox.checked = options.httpsRedirect;
	certFileInput.value = options.cert || '';
	keyFileInput.value = options.key || '';
});

