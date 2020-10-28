'use strict';

const menu = document.querySelector('#side-menu');
const toggle = document.querySelector('#menu-toggle');


toggle.addEventListener('click', e => {
	menu.classList.toggle('hidden');
});
