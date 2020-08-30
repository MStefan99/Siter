'use strict';

import Jui from '/js/jui.js';
import createMenu from '/js/menu.js';

const tabs = document.getElementsByClassName('tab');
const tabContainer = document.getElementById('tab-container');


function openTab() {
	const prevTab = document.querySelector('.tab-selected');
	if (prevTab != null) {
		prevTab.classList.remove('tab-selected');
		const prevContent = document.getElementById(prevTab.id.replace('tab-selector', 'tab'));
		prevContent.classList.remove('tab-selected');
	}
	this.classList.add('tab-selected');
	const content = document.getElementById(this.id.replace('tab-selector', 'tab'));
	content.classList.add('tab-selected');
	createMenu();
}

for (const tab of tabs) {
	const tabSelector = new Jui(`
		<div id="${tab.id.replace('tab', 'tab-selector')}" class="tab-selector">
			<p>
				${document.querySelector('#' + tab.id + ' h1').innerHTML}
			</p>
		</div>
	`)
	.appendTo(tabContainer);
	if (tab.classList.contains('tab-selected')) {
		tabSelector.addClass('tab-selected');
	}
	tabSelector.on('click', openTab);
}
