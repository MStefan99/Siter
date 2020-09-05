'use strict';

import Jui from '/js/lib/jui.js';


function remove(element) {
	element.parentNode.removeChild(element);
}


export default function createMenu(selector) {
	const menuList = document.querySelector('#menu-container');
	const oldHeaderList = document.querySelectorAll('.menu-item');
	const headerList = document.querySelectorAll(selector);

	if (oldHeaderList) {
		for (const header of oldHeaderList) {
			remove(header);
		}
	}
	for (const header of headerList) {
		new Jui(`
			<li>
				<a href="#${header.id}">
					<${header.tagName.match(/H\d/) ? 'h2' : 'p'}>
						${header.innerText}
					</${header.tagName.match(/H\d/) ? 'h2' : 'p'}>
				</a>
			</li>
		`)
		.appendTo(menuList);
	}
}
