'use strict';

import notify from '/js/notifications.js';


const passwordForm = document.getElementById('password-form');
const netForm = document.getElementById('net-form');
const secureCheckbox = document.getElementById('secure-checkbox');
const redirectCheckbox = document.getElementById('redirect-checkbox');
const redirectLabel = document.getElementById('redirect-label');


passwordForm.addEventListener('submit', e => {
	if (passwordForm.newPassword.value !== passwordForm.newPasswordRepeat.value) {
		notify.tell('Passwords do not match', 'Please check your passwords and try again', 'warning');
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

		fetch('https://' + window.location.hostname + ':' + netForm.httpsPort.value + window.location.pathname, {mode: 'no-cors'})
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
