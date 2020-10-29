'use strict';

const httpsCheckbox = document.querySelector('#https-checkbox');
const redirectCheckbox = document.querySelector('#redirect-checkbox');
const certFileInput = document.querySelector('#cert-file-input');
const keyFileInput = document.querySelector('#key-file-input');


fetch('/api/v0.1/security/https/').then(async res => {
	const options = await res.json();

	httpsCheckbox.checked = options.httpsEnabled;
	redirectCheckbox.checked = options.httpsRedirect;
	certFileInput.value = options.certFile || '';
	keyFileInput.value = options.keyFile || '';
});

