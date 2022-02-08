'use strict';


export default function createMenu(selector) {
	const menuList = document.querySelector('#menu-container');
	const headerList = document.querySelectorAll(selector);

	while (menuList.firstChild) {
		menuList.removeChild(menuList.firstChild)
	}

	for (const header of headerList) {
		const id = 'route-' + header.id;
		const anchor = document.createElement('div');
		anchor.classList.add('route-anchor');
		anchor.id = id;
		header.parentNode.insertBefore(anchor, header);

		const element = document.createElement('li');
		element.innerHTML = `
			<a href="#${id}">
				<${header.tagName.match(/H\d/)? 'h2' : 'p'}>
					${header.innerText}
				</${header.tagName.match(/H\d/)? 'h2' : 'p'}>
			</a>
		`;

		menuList.appendChild(element);
	}
}
