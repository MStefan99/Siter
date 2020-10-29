'use strict';

import * as notify from '/js/lib/notifications.js';


const httpsCheckbox = document.querySelector('#https-checkbox');
const redirectCheckbox = document.querySelector('#redirect-checkbox');
const certFileInput = document.querySelector('#cert-file-input');
const keyFileInput = document.querySelector('#key-file-input');


document.querySelector('#https-link').href = window.location.href
		.replace('http', 'https');


redirectCheckbox.addEventListener('click', async e => {
	if (redirectCheckbox.checked) {
		redirectCheckbox.checked = await notify.ask('Are you sure?',
				'Please make sure that you can access the website using HTTPS first' +
				'or you could lose access to the Siter web interface.',
				'warning');
	}
});


fetch('/api/v0.1/security/https/').then(async res => {
	const options = await res.json();

	httpsCheckbox.checked = options.httpsEnabled;
	redirectCheckbox.checked = options.httpsRedirect;
	certFileInput.value = options.certFile || '';
	keyFileInput.value = options.keyFile || '';
});

