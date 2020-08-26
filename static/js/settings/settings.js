'use strict';

import createMenu from '/js/menu.js';
import Jui from '/js/jui.js';


const tabs = document.getElementsByClassName('tab-selector');
const main = document.querySelector('main');

createMenu();


function loadScript(tab) {
	new Jui(`
  	<script async type="module" src="${'/js/settings/' + tab.id.replace('tab-selector-', '') + '.js'}"></script>
  `)
	.appendTo(main);
}


for (const tab of tabs) {
	if (tab.classList.contains('tab-selected')) {
		loadScript(tab);
	} else {
		tab.addEventListener('click', () => {
			loadScript(this);
		});
	}
}
