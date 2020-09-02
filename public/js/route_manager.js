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
	.on('click', e => {
		createMenu(new Jui(`
			<form>
				<h2>Add new route</h2>
				<h3>Route mask</h3>
				<div class="row">
					<input class="col" type="text" placeholder="subdomain">
					<span class="mx-1 text-muted">.my-domain.tld:</span>
					<input class="col" type="number" placeholder="Port">
					<span class="mx-1 text-muted">/</span>
					<input class="col" type="text" placeholder="prefix">
				</div>
				<h3>Security</h3>
				<div class="row">
					<input class="col-8" type="checkbox">
					<label class="col-4">Enable HTTPS</label>
				</div>
				<input class="btn btn-success" type="submit" value="Add route">
			</form>
		`))
	});
