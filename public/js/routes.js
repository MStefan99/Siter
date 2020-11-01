'use strict';

import * as notify from './lib/notifications.js';
import createMenu from './lib/navmenu.js';
import Jui from '/js/lib/jui.js';
import * as routeEditor from '/js/route_editor.js';


const statusField = new Jui('#status-field');
const routeContainer = new Jui('#route-container');
let routeArr = [];


function createRouteElement(route) {
	const routeElement = new Jui('<div class="route mx-3">')
	.append(new Jui('<h3>Custom route</h3>')
		.append(new Jui('<div class="route-icon-container float-right"></div>')
			.append(new Jui(`
				<img src="/img/edit.svg" alt="Settings icon"
						 class="icon edit-icon clickable mr-2">
				`)
				.on('click', () => {
					routeEditor.createRouteForm('edit', route);
				})
			)
			.append(new Jui(`
				<img src="/img/close.svg" alt="Remove icon"
						 class="icon remove-icon clickable">
				`)
				.on('click', async () => {
					if (await notify.ask('Delete route',
						'Are you sure you want to delete this route?',
						'warning')) {
						const res = await fetch('/api/v0.1/routes/' + route.id + '/', {
							method: 'DELETE'
						});

						if (!res.ok) {
							notify.tell('Route not deleted',
								'Failed to delete route',
								'danger')
						} else {
							routeElement.remove();
							notify.tell('Route deleted',
								'Route was successfully deleted',
								'success')
						}
					}
				})
			)
		)
	)
	.prop('data-route-id', route.id)
	.append(new Jui(`
			<div class="route-mask border-bottom">
				<h4>URL mask</h4>
				<a target="_blank" id="route-${route.id}"
					 class="route-link" href="${route.secure? 'https' :
		'http'}://${route.domain}/${route.prefix || ''}">
					<b class="domain">${route.domain}</b>
					<span class="text-muted">:</span>
					<b class="port">${route.port}</b>
					<span class="text-muted">/</span>
					<b class="prefix">${route.prefix || ''}</b>
				</a>
			</div>
		`))
	.append(new Jui(`<div class="route-security border-bottom">
			<h4>Security</h4>
			<p>Secure: <b class="secure">${route.secure? 'yes' : 'no'}</b></p>
			</div>
		`)
	.if(route.secure,
		jui => jui.append(new Jui(`
					<p>Certificate file location: 
						<b class="cert-file">${route.certFile}</b>
					</p>
					<p>Key file location:
						<b class="key-file">${route.keyFile}</b>
					</p>
				`))
	))
	.append(new Jui(`
			<div class="route-target border-bottom">
				<h4>Target</h4>
			</div>
		`)
		.if(route.directory,
			target => target.append(new Jui(`
				<p>Directory: <b class="directory">${route.directory}</b></p>
			`)),
			target => target.append(new Jui(`
				<p>IP: <b class="target-addr">${route.targetIP}</b></p>
				<p>Port: <b class="target-port">${route.targetPort}</b></p>
			`))
		)
	);

	return routeElement;
}


export function addRouteElement(route) {
	if (!route.id) {
		throw new Error('No route id defined.');
	}

	createRouteElement(route)
	.appendTo(routeContainer);
}


export function editRouteElement(routeID, newRoute) {
	new Jui(`.route[data-route-id="${routeID}"]`)
	.replaceWith(createRouteElement(newRoute));
}

// TODO: factor out dashboard
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

	createMenu('#dashboard h2, a.route-link');
});
