'use strict';

const backdrop = document.querySelector('#menu-backdrop');
const toggle = document.querySelector('#menu-toggle');

toggle.addEventListener('click', e => {
	backdrop.classList.toggle('hidden');
});

backdrop.addEventListener('click', e => {
	backdrop.classList.add('hidden');
});
