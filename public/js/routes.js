'use strict';

import * as notify from './lib/notifications.js';
import createMenu from './lib/navmenu.js';
import Jui from '/js/lib/jui.js';
import {createRouteForm} from '/js/route_editor.js';


const statusField = new Jui('#status-field');
const routeContainer = new Jui('#route-container');
let routeArr = [];


let tld = window.location.hostname
	.replace(/^(.*?)\.(\w*?)\.(\w*)$/, '$2.$3');
if (tld.match('localhost')) {
	tld = 'localhost';
}


export function addRouteElement(route) {
	if (!route.id) {
		throw new Error('No route id defined.');
	}

	new Jui(`
		<div class="route mx-3">
			<h3>Custom route</h3>
		</div>
	`)
		.prop('data-route-id', route.id)
		.append(new Jui('<div class="route-mask border-bottom"></div>')
			.append(new Jui(`
				<img src="/img/settings.svg" alt="Settings icon"
						 class="icon float-right clickable">
			`).on('click', menuEvent => {
				createRouteForm('edit', route)
			}))
			.append(new Jui(`
				<h4>URL mask</h4>
				<a target="_blank" id="route-${route.id}"
				 class="route-link" href="${route.secure ? 'https' :
				'http'}://${route.subdomain}.${tld}/${route.prefix || ''}">
					<b class="subdomain">${route.subdomain}</b>
					<span class="text-muted">.your-domain.tld:</span>
					<b class="port">${route.port}</b>
					<span class="text-muted">/</span>
					<b class="prefix">${route.prefix || ''}</b>
				</a>
			`)))
		.append(new Jui(`<div class="route-security border-bottom">
			<h4>Security</h4>
			<p class="secure">Secure: <b>${route.secure ? 'yes' : 'no'}</b></p>
			</div>
		`)
			.if(route.secure,
				jui => jui.append(new Jui(`
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
			.if(route.directory,
				jui => jui.append(new Jui(`
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
		routeArr = routes;
		statusField.html('Your server is running fine');
		statusField.addClass('alert-success');

		for (const route of routes) {
			addRouteElement(route)
		}
	}

	createMenu('h2, a.route-link');
});
