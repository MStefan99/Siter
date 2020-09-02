'use strict';

import Jui from '/js/lib/jui.js';


function remove(element) {
	element.parentNode.removeChild(element);
}


export default function createMenu() {
	const menuList = document.querySelector('#menu-container');
	const oldHeaderList = document.querySelectorAll('.menu-item');
	const headerList = document.querySelectorAll('h2');

	if (oldHeaderList) {
		for (const header of oldHeaderList) {
			remove(header);
		}
	}
	for (const header of headerList) {
		new Jui(`
			<li>
				<a href="#${header.id}">
					<${header.tagName}>
						${header.innerText}
					</${header.tagName}>
				</a>
			</li>
		`)
		.appendTo(menuList);
	}
}
