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


function validateForm() {
	let valid = true;

	const subdomainInput = new Jui('#route-subdomain');
	const portInput = new Jui('#route-port');
	const prefixInput = new Jui('#route-prefix');

	const secureCheckbox = new Jui('#route-security-checkbox');
	const certFileInput = new Jui('#route-cert-file');
	const keyFileInput = new Jui('#route-key-file');

	const radioChecks = new Jui('.radio-check');
	const targetRadios = new Jui('.target-radio');
	const targetDirectoryInput = new Jui('#route-target-dir');
	const targetServerAddrInput = new Jui('#route-target-server-addr');
	const targetServerPortInput = new Jui('#route-target-server-port');

	if (!subdomainInput.val() && !portInput.val() && !prefixInput.val()) {
		valid = false;
		setValid(subdomainInput, false);
		setValid(portInput, false);
		setValid(prefixInput, false);
	} else {
		setValid(subdomainInput, true);
		setValid(portInput, true);
		setValid(prefixInput, true);
	}

	if (secureCheckbox.nodes[0].checked) {
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
	}

	if (targetRadios.nodes[0].checked) {
		setValid(radioChecks, true);
		if (!targetDirectoryInput.val()) {
			valid = false;
			setValid(targetDirectoryInput, false);
		} else {
			setValid(targetDirectoryInput, true);
		}
	} else if (targetRadios.nodes[1].checked) {
		setValid(radioChecks, true);
		if (!targetServerAddrInput.val() || !targetServerPortInput.val()) {
			valid = false;
			setValid(targetServerAddrInput, false);
			setValid(targetServerPortInput, false);
		} else {
			setValid(targetServerAddrInput, true);
			setValid(targetServerPortInput, true);
		}
	} else {
		setValid(radioChecks, false);
	}

	return valid;
}


export function createRouteForm(action, route) {
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

	createMenu(new Jui(`
		<form>
			<h2>${label}</h2>
			<h3>Route mask</h3>
			<div class="row form-group">
				<input id="route-subdomain" class="col"
							 type="text" placeholder="subdomain" value="${route.subdomain || ''}">
				<span class="mx-1 text-muted col-form-label">.my-domain.tld:</span>
				<input id="route-port" class="col" type="number"
							 placeholder="80" value="${route.port || 80}">
				<span class="mx-1 text-muted col-form-label">/</span>
				<input id="route-prefix" class="col" type="text"
							 placeholder="prefix" value="${route.prefix || ''}">
			</div>
			<h3>Security</h3>
			<div class="form-check">
				<input id="route-security-checkbox" class="col-8"
							 type="checkbox" ${route.secure ? 'checked' : ''}>
				<label for="route-security-checkbox" class="col-4">Enable HTTPS</label>
			</div>
			<div id="route-security-group" class="d-none">
				<div class="form-group">
					<label for="route-cert-file">Certificate file path</label>
					<input id="route-cert-file" type="text"
								 placeholder="/var/cert/cert.crt" value="${route.certFile || ''}">
					<span class="invalid-feedback">No certificate file</span>
				</div>
				<div class="form-group">
					<label for="route-key-file">Key file path</label>
					<input id="route-key-file" type="text" 
								 placeholder="/var/cert/key.pem" value="${route.keyFile || ''}">
					<span class="invalid-feedback">No key file</span>
				</div>
			</div>
			<h3>Target</h3>
			<div class="form-group">
				<div class="form-check radio-check">
					<input id="route-dir-radio" class="target-radio"
								 type="radio" name="target">
					<label for="route-dir-radio">Directory</label>
				</div>
				<div class="form-check radio-check">
					<input id="route-server-radio" class="target-radio"
								 type="radio" name="target">
					<label for="route-server-radio">Web server</label>
				</div>
				<span class="invalid-feedback">Please select the route type</span>
			</div>
			<div id="route-dir-group" class="form-group d-none">
				<label>Directory path</label>
				<input id="route-target-dir" type="text" 
							 placeholder="/var/dir/" value="${route.directory || ''}">
				<span class="invalid-feedback">No directory</span>
			</div>
			<div id="route-server-group" class="form-group d-none">
				<label>Server address</label>
				<div class="row form-group">
					<input id="route-target-server-addr" class="col" type="text"
								 placeholder="localhost" value="${route.targetIP || ''}">
					<span class="mx-1 text-muted col-form-label">:</span>
					<input id="route-target-server-port" class="col" type="number" 
								 placeholder="80" value="${route.targetPort || ''}">
				</div>
			</div>
			<input class="btn btn-success" type="submit" value="${label}">
		</form>
	`)
		.on('input', e => {
			validateForm();
		})
		.on('submit', async formEvent => {
			formEvent.preventDefault();

			if (validateForm()) {
				const route = {
					subdomain: new Jui('#route-subdomain').val() || null,
					port: new Jui('#route-port').val() || 80,
					prefix: new Jui('#route-prefix').val() || null,
					secure: new Jui('#route-security-checkbox').nodes[0].checked || false,
					certFile: new Jui('#route-cert-file').val() || null,
					keyFile: new Jui('#route-key-file').val() || null
				};

				if (new Jui('form .target-radio').nodes[0].checked) {
					route.directory = new Jui('#route-target-dir').val() || null;
				} else {
					route.directory = null;
					route.targetIP = new Jui('#route-target-server-addr').val() || null;
					route.targetPort = new Jui('#route-target-server-port').val() || null;
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
		}));

	const checkbox = new Jui('form #route-security-checkbox');
	const radios = new Jui('form .target-radio');
	const securityGroup = new Jui('form #route-security-group');
	const directoryGroup = new Jui('form #route-dir-group');
	const serverGroup = new Jui('form #route-server-group');

	if (route.secure) {
		checkbox.nodes[0].checked = true;
		securityGroup.removeClass('d-none');
	}

	if (route.directory) {
		radios.nodes[0].checked = true;
		directoryGroup.removeClass('d-none');
	} else if (route.targetIP || route.targetPort) {
		radios.nodes[1].checked = true;
		serverGroup.removeClass('d-none');
	}

	checkbox.on('click', () => {
		new Jui('form #route-security-group')
			.if(checkbox.nodes[0].checked,
				group => group.removeClass('d-none'),
				group => group.addClass('d-none'));
	});

	radios.on('click', () => {
		if (radios.nodes[0].checked) {
			directoryGroup.removeClass('d-none');
			serverGroup.addClass('d-none');
		} else {
			directoryGroup.addClass('d-none');
			serverGroup.removeClass('d-none');
		}
	});
}


new Jui('#add-route-button')
	.on('click', buttonEvent => {
		createRouteForm('add');
	});
