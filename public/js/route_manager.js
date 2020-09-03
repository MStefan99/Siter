'use strict';

import Jui from './lib/jui.js';


const main = new Jui('main');
const routeContainer = new Jui('#route-container');


function remove(element) {
	element.parentNode.removeChild(element);
}


function createMenu(menuContent) {
	new Jui(`<div class="popup-backdrop"></div>`)
		.append(new Jui(`<div class="popup"></div>`)
			.append(menuContent))
		.on('click', e => {
			if (e.target.classList.contains('popup-backdrop')) {
				remove(e.currentTarget);
			}
		})
		.appendTo(main);
}


const newRouteButton = new Jui('#add-route-button')
	.on('click', buttonEvent => {
		createMenu(new Jui(`
			<form>
				<h2>Add new route</h2>
				<h3>Route mask</h3>
				<div class="row form-group">
					<input class="col" type="text" placeholder="subdomain">
					<span class="mx-1 text-muted col-form-label">.my-domain.tld:</span>
					<input class="col" type="number" placeholder="Port">
					<span class="mx-1 text-muted col-form-label">/</span>
					<input class="col" type="text" placeholder="prefix">
				</div>
				<h3>Security</h3>
				<div class="form-check">
					<input id="route-security-checkbox" class="col-8" type="checkbox">
					<label class="col-4">Enable HTTPS</label>
				</div>
				<div id="route-security-group" class="d-none">
					<div class="form-group">
						<label>Certificate file path</label>
						<input type="text" placeholder="/var/cert/cert.crt">
					</div>
					<div class="form-group">
						<label>Key file path</label>
						<input type="text" placeholder="/var/cert/key.pem">
					</div>
				</div>
				<h3>Target</h3>
				<div class="form-check">
					<input class="target-radio" type="radio" name="target" required>
					<label>Directory</label>
				</div>
				<div class="form-check">
					<input class="target-radio" type="radio" name="target">
					<label>Local server</label>
				</div>
				<div id="route-dir-group" class="form-group d-none">
					<label>Directory path</label>
					<input type="text" placeholder="/var/dir/">
				</div>
				<div id="route-server-group" class="form-group d-none">
					<label>Server address</label>
					<div class="row form-group">
						<input class="col" type="text" placeholder="localhost">
						<span class="mx-1 text-muted col-form-label">:</span>
						<input class="col" type="number" placeholder="80">
					</div>
				</div>
				<input class="btn btn-success" type="submit" value="Add route">
			</form>
		`)
			.on('submit', formEvent => {
				formEvent.preventDefault();
			}));

		const checkbox = new Jui('form #route-security-checkbox')
			.on('click', checkboxEvent => {
				new Jui('form #route-security-group')
					.if(checkbox.nodes[0].checked,
						group => group.removeClass('d-none'),
						group => group.addClass('d-none'));
			});

		const radios = new Jui('form .target-radio')
			.on('click', radioEvent => {
				const directoryGroup = new Jui('form #route-dir-group');
				const serverGroup = new Jui('form #route-server-group');

				if (radios.nodes[0].checked) {
					directoryGroup.removeClass('d-none');
					serverGroup.addClass('d-none');
				} else {
					directoryGroup.addClass('d-none');
					serverGroup.removeClass('d-none');
				}
			});
	});
