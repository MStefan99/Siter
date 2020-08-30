'use strict';

import * as notify from './notifications.js';
import createMenu from './menu.js';
import Jui from '/js/jui.js';


const statusField = new Jui('#status-field');
const routeContainer = new Jui('#route-container');
const newRouteButton = new Jui('#add-route-button')
	.on('click', e => {
		new Jui(`
			<div class="popup">
				Popup
			</div>
		`)
	});


let tld = window.location.hostname
	.replace(/^(.*?)\.(\w*?)\.(\w*)$/, '$2.$3');
if (tld.match('localhost')) {
	tld = 'localhost';
}


export function addRouteElement(route) {
	new Jui(`
				<div class="route mx-3">
					<h3>Custom route</h3>
				</div>`)
		.append(new Jui('<div class="route-mask border-bottom"></div>')
			.append(new Jui(`
				<h4>URL mask</h4>
				<a target="_blank" href="${route.secure ? 'https' :
				'http'}://${route.subdomain}.${tld}/${route.prefix || ''}">
					<span class="subdomain">${route.subdomain}</span>
					<span class="text-muted">.your-domain.tld:</span>
					<b class="port">${route.port}</b>
					<span class="text-muted">/</span>
					<b class="prefix">${route.prefix || '*'}</b>
				</a>
			`)))
		.append(new Jui(`<div class="route-security border-bottom">
			<h4>Security</h4>
			<p class="secure">Secure: <b>${route.secure ? 'yes' : 'no'}</b></p>
			</div>
		`)
			.if(route.secure, jui =>
				jui.append(new Jui(`
					<p class="key-file">Key file location: <b>${route.keyFile}</b></p>
					<p class="cert-file">Certificate file location: 
						<b>${route.certFile}</b>
					</p>
				`))
			))
		.append(new Jui(`
			<div class="route-target border-bottom">
				<h4>Target</h4>
			</div>
		`)
			.if(route.directory, jui => jui.append(new Jui(`
				<p class="directory">Directory: <b>${route.directory}</b></p>
			`)),
				jui => jui.append(new Jui(`
				<p class="ip">IP: <b>${route.targetIP}</b></p>
				<p class="port">Port: <b>${route.targetPort}</b></p>
			`))
			)
		)
		.appendTo(routeContainer);
}


addEventListener('load', async e => {
	const res = await fetch('/api/v0.1/routes/')
		.catch(err => {
			statusField.html('Server unavailable');
			statusField.removeClass('alert-secondary');
			statusField.addClass('alert-danger');
			notify.tell('Server unavailable',
				'Server refused to connect. Please check your firewall settings and ' +
				'restart Siter.',
				'danger');
		});

	statusField.removeClass('alert-secondary');
	if (!res.ok) {
		statusField.html('Server error');
		statusField.addClass('alert-warning');
		await notify.tell('Server error',
			'Server is available but returned an invalid response. ' +
			'Please restart the server and check whether you are logged in.',
			'warning');
	} else {
		const routes = await res.json();
		statusField.html('Your server is running fine');
		statusField.addClass('alert-success');

		for (const route of routes) {
			addRouteElement(route)
		}
	}

	createMenu();
});