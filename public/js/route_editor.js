'use strict';

import Jui from './lib/jui.js';
import * as notify from './lib/notifications.js';
import * as routeUI from './routes.js';


function remove(element) {
	element.parentNode.removeChild(element);
}


function createMenu(menuContent) {
	new Jui(`<div class="popup-backdrop"></div>`)
		.append(new Jui(`<div class="popup shadow-sm"></div>`)
			.append(menuContent))
		.on('mousedown', e => {
			if (e.target.classList.contains('popup-backdrop')) {
				remove(e.currentTarget);
			}
		})
		.appendTo(new Jui('main'));
}


function setValid(element, valid) {
	if (element instanceof Jui) {
		if (valid) {
			element.removeClass('is-invalid');
			element.addClass('is-valid');
		} else {
			element.addClass('is-invalid');
			element.removeClass('is-valid');
		}
	} else {
		if (valid) {
			element.classList.remove('is-invalid');
			element.classList.add('is-valid');
		} else {
			element.classList.add('is-invalid');
			element.classList.remove('is-valid');
		}
	}
}


export function createRouteForm(action, route = {}) {
	let url, method, label;

	switch (action) {
		case 'add':
			url = '/api/v0.1/routes/';
			method = 'POST';
			label = 'Add route';
			route = {};
			break;
		case 'edit':
			url = '/api/v0.1/routes/' + route.id + '/';
			method = 'PUT';
			label = 'Edit route';
			if (!route) {
				throw new Error('No route to edit.');
			}
			break;
		default:
			throw new Error('No such action.');
	}

	const domainInput = new Jui(`
		<input id="route-domain" class="col" type="text"
					 placeholder="domain" value="${route.domain || ''}">
	`);
	const portInput = new Jui(`
		<input id="route-port" class="col" type="number"
					 placeholder="80" value="${route.port || 80}">
	`);
	const prefixInput = new Jui(`
		<input id="route-prefix" class="col" type="text"
					 placeholder="prefix" value="${route.prefix || ''}">
	`);
	const secureCheckbox = new Jui(`
		<input id="route-security-checkbox"
					 type="checkbox" ${route.secure? 'checked' : ''}>
	`);
	const certFileInput = new Jui(`
		<input id="route-cert-file" type="text"
					 placeholder="/var/cert/cert.crt" value="${route.certFile || ''}">
	`);
	const keyFileInput = new Jui(`
		<input id="route-key-file" type="text" 
					 placeholder="/var/cert/key.pem" value="${route.keyFile || ''}">
	`);
	const directoryRadio = new Jui(`
		<input id="route-dir-radio" class="target-radio"
					 type="radio" name="target"
					 ${route.target === 'directory'? 'checked' : ''}>
	`);
	const serverRadio = new Jui(`
		<input id="route-server-radio" class="target-radio"
					 type="radio" name="target" 
					 ${route.target === 'server'? 'checked' : ''}>
	`);
	const targetDirectoryInput = new Jui(`
		<input id="route-target-dir" type="text" 
					 placeholder="/var/dir/" value="${route.tDirectory || ''}">
	`);
	const targetAddressInput = new Jui(`
		<input id="route-target-server-addr" class="col" type="text"
					 placeholder="localhost" value="${route.tAddr || ''}">
	`);
	const targetPortInput = new Jui(`
		<input id="route-target-server-port" class="col" type="number" 
					 placeholder="80" value="${route.tPort || ''}">
	`);

	const securityGroup = new Jui(`
			<div class="${route.secure? '' : 'd-none'}"/>
		`)
		.append(new Jui(`<div class="form-group"/>`)
			.append(new Jui(`<label for="route-cert-file">Certificate file path</label>`))
			.append(certFileInput)
			.append(new Jui(`<span class="invalid-feedback">No certificate file</span>`))
		)
		.append(new Jui(`<div class="form-group"/>`)
			.append(new Jui(`<label for="route-key-file">Key file path</label>`))
			.append(keyFileInput)
			.append(new Jui(`<span class="invalid-feedback">No key file</span>`))
		);
	const radioGroup = new Jui(`<div class="form-group">`)
		.append(new Jui(`<div class="form-check radio-check">`)
			.append(directoryRadio)
			.append(new Jui(`<label for="route-dir-radio">Directory</label>`))
		)
		.append(new Jui(`<div class="form-check radio-check"/>`)
			.append(serverRadio)
			.append(new Jui(`<label for="route-server-radio">Web server</label>`))
		);
	const directoryGroup = new Jui(`
			<div class="form-group ${route.target === 'directory'? '' : 'd-none'}"/>
		`)
		.append(new Jui(`<label>Directory path</label>`))
		.append(targetDirectoryInput)
		.append(new Jui(`<span class="invalid-feedback">No directory</span>`));
	const serverGroup = new Jui(`
			<div class="form-group ${route.target === 'server'? '' : 'd-none'}"/>
		`)
		.append(new Jui(`<label>Server address</label>`))
		.append(new Jui(`<div class="row form-group"/>`)
			.append(targetAddressInput)
			.append(new Jui(`<span class="mx-1 text-muted col-form-label">:</span>`))
			.append(targetPortInput)
		);

	const validateForm = function () {
		let valid = true;

		for (const input of [domainInput, portInput]) {
			if (!input.val()) {
				valid = false;
				setValid(input, false);
			} else {
				setValid(input, true);
			}
		}

		if (secureCheckbox.prop('checked')) {
			portInput.val(443);
			if (!certFileInput.val()) {
				valid = false;
				setValid(certFileInput, false);
			} else {
				setValid(certFileInput, true);
			}
			if (!keyFileInput.val()) {
				valid = false;
				setValid(keyFileInput, false);
			} else {
				setValid(keyFileInput, true);
			}
		} else {
			portInput.val(80);
		}

		if (directoryRadio.prop('checked')) {
			setValid(radioGroup, true);
			if (!targetDirectoryInput.val()) {
				valid = false;
				setValid(targetDirectoryInput, false);
			} else {
				setValid(targetDirectoryInput, true);
			}
		} else if (serverRadio.prop('checked')) {
			setValid(radioGroup, true);
			if (!targetAddressInput.val() || !targetPortInput.val()) {
				valid = false;
				setValid(targetAddressInput, false);
				setValid(targetPortInput, false);
			} else {
				setValid(targetAddressInput, true);
				setValid(targetPortInput, true);
			}
		} else {
			setValid(radioGroup, false);
		}

		return valid;
	};

	const menu = new Jui(`<form/>`)
		.append(new Jui(`<h2>${label}</h2>`))
		.append(new Jui(`<h3>Route mask</h3>`))
		.append(new Jui(`<div class="row form-group"/>`)
			.append(domainInput)
			.append(new Jui(`<span class="mx-1 text-muted col-form-label">:</span>`))
			.append(portInput)
			.append(new Jui(`<span class="mx-1 text-muted col-form-label">/</span>`))
			.append(prefixInput)
		)
		.append(new Jui(`<h3>Security</h3>`))
		.append(new Jui(`<div class="form-check"/>`)
			.append(secureCheckbox)
			.append(new Jui(`<label for="route-security-checkbox">Enable HTTPS</label>`))
		)
		.append(securityGroup)
		.append(new Jui(`<h3>Target</h3>`))
		.append(radioGroup)
		.append(directoryGroup)
		.append(serverGroup)
		.append(new Jui(`<input class="btn btn-success" type="submit" value="${label}">`))
		.on('input', e => {
			validateForm();
		})
		.on('submit', async formEvent => {
			formEvent.preventDefault();

			if (validateForm()) {
				const route = {
					domain: domainInput.val(),
					port: portInput.val() || 80,
					prefix: prefixInput.val() || null,
					secure: !!secureCheckbox.prop('checked'),
					certFile: certFileInput.val() || null,
					keyFile: keyFileInput.val() || null,
					tDirectory: targetDirectoryInput.val() || null,
					tAddr: targetAddressInput.val() || null,
					tPort: targetPortInput.val() || null,
				};

				if (directoryRadio.prop('checked')) {
					route.target = 'directory';
				} else if (serverRadio.prop('checked')) {
					route.target = 'server';
				}

				const res = await fetch(url, {
					method: method,
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						route: route
					})
				});

				if (!res.ok) {
					notify.tell('Route not saved',
						'An error occurred while saving route',
						'danger');
				} else {
					const addedRoute = await res.json();
					new Jui('.popup-backdrop').remove();

					switch (action) {
						case 'add':
							routeUI.addRouteElement(addedRoute);
							break;
						case 'edit':
							routeUI.editRouteElement(addedRoute.id, addedRoute);
							break;
					}

					notify.tell('Route saved',
						'Route was successfully saved',
						'success');
				}
			}
		});

	secureCheckbox.on('click', e => {
		if (secureCheckbox.prop('checked')) {
			securityGroup.removeClass('d-none');
		} else {
			securityGroup.addClass('d-none');
		}
	});

	directoryRadio.on('click', e => {
		if (directoryRadio.prop('checked')) {
			directoryGroup.removeClass('d-none');
			serverGroup.addClass('d-none');
		} else {
			directoryGroup.addClass('d-none');
			serverGroup.removeClass('d-none');
		}
	});
	serverRadio.on('click', e => {
		if (serverRadio.prop('checked')) {
			serverGroup.removeClass('d-none');
			directoryGroup.addClass('d-none');
		} else {
			serverGroup.addClass('d-none');
			directoryGroup.removeClass('d-none');
		}
	});

	createMenu(menu);
}


new Jui('#add-route-button')
	.on('click', buttonEvent => {
		createRouteForm('add');
	});
