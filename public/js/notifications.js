'use strict';

const main = document.querySelector('main');
let notificationContainer = document.querySelector('#notification-container');


if (!notificationContainer) {
	notificationContainer = document.createElement('div');
	notificationContainer.id = 'notification-container';
	main.appendChild(notificationContainer);
}


function remove(element, delay = 0) {
	if (element && element.parentNode) {
		setTimeout(() => {
			element.parentNode.removeChild(element);
		}, delay);
	}
}


function close(notificationElement) {
	notificationElement.classList.add('inactive');
	remove(notificationElement, 500);
}


export default {
	tell(title, message, type = 'secondary', timeout = 5000) {
		if (!['light', 'dark', 'primary', 'secondary',
			'success', 'danger', 'warning', 'info'].includes(type)) {
			throw new Error('No such notification type');
		}
		const notificationElement = document.createElement('div');
		notificationElement.classList.add('notification', 'inactive', 'bg-' + type);
		const closeElement = document.createElement('span');
		closeElement.classList.add('icon', 'close-icon', 'clickable');
		notificationElement.appendChild(closeElement);
		const titleElement = document.createElement('h2');
		titleElement.innerText = title;
		notificationElement.appendChild(titleElement);
		const messageElement = document.createElement('p');
		messageElement.innerText = message;
		notificationElement.appendChild(messageElement);
		notificationContainer.appendChild(notificationElement);
		setTimeout(() => {
			notificationElement.classList.remove('inactive');
		}, 10);
		return new Promise((resolve, reject) => {
			closeElement.addEventListener('click', function () {
				close(notificationElement);
				resolve();
			});
			if (timeout > 0) {
				setTimeout(() => {
					close(notificationElement);
					resolve();
				}, timeout);
			}
		});
	},


	ask(title, message, type = 'secondary', timeout = 10000) {
		if (!['light', 'dark', 'primary', 'secondary',
			'success', 'danger', 'warning', 'info'].includes(type)) {
			throw new Error('No such notification type');
		}
		const notificationElement = document.createElement('div');
		notificationElement.classList.add('notification', 'inactive', 'bg-' + type);
		const titleElement = document.createElement('h2');
		titleElement.innerText = title;
		notificationElement.appendChild(titleElement);
		const messageElement = document.createElement('p');
		messageElement.innerText = message;
		notificationElement.appendChild(messageElement);
		const confirmElement = document.createElement('span');
		confirmElement.classList.add('btn', 'btn-primary');
		confirmElement.innerText = 'Yes';
		notificationElement.appendChild(confirmElement);
		const rejectElement = document.createElement('span');
		rejectElement.classList.add('btn', 'btn-secondary');
		rejectElement.innerText = 'No';
		notificationElement.appendChild(rejectElement);
		notificationContainer.appendChild(notificationElement);
		setTimeout(() => {
			notificationElement.classList.remove('inactive');
		}, 10);
		return new Promise((resolve, reject) => {
			confirmElement.addEventListener('click', function () {
				resolve(true);
				close(notificationElement);
			});
			rejectElement.addEventListener('click', function () {
				resolve(false);
				close(notificationElement);
			});
			if (timeout > 0) {
				setTimeout(function () {
					close(notificationElement);
					resolve(false);
				}, timeout);
			}
		});
	}
};
