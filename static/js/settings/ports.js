'use strict';

import ServerSettings from '/js/server_settings.js';
import * as notify from '/js/notifications.js';
import Jui from '/js/jui.js';


const main = document.querySelector('main');
const tab = document.querySelector('#tab-ports');
const table = document.querySelector('#ports-table tbody');

const defaultPort = {
	port: 80,
	module: null,
	active: false
};
const settings = new ServerSettings();


function remove(elements) {
	if (elements) {
		if (elements.parentNode) {
			elements.parentNode.removeChild(elements);
		} else {
			for (const element of elements) {
				element.parentNode.removeChild(element);
			}
		}
	}
}


function closePopup() {
	remove(document.querySelector('#main-fade'));
	return remove(document.querySelector('#popup, #popup *'));
}


function updatePort(port, action) {
	if (action !== 'add' && action !== 'edit' && action !== 'delete') {
		throw new Error('No such action!');
	}
	if (action === 'delete') {
		if (!notify.ask(`Are you sure to delete port ${port.port}? This action cannot be undone!`)) {
			return;
		}
	}
	return fetch('/settings/ports/' + action + '/' + (action !== 'add' ? port.id : ''), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json;charset=utf-8'
		},
		body: JSON.stringify(port)
	}).then(async (res) => {
		if (res.status === 200) {
			closePopup();
			await notify.tell('Port updated',
				'Port info was updated successfully!',
				'ok');
			closePopup();
			await buildTable(await res.json());
		} else if (res.status === 403) {
			await notify.tell('No permission',
				'This action can be performed by server administrator only. Contact administrator to get admin permissions.',
				'error');
		} else {
			await notify.tell('Cannot add port',
				'Please check whether this port is already added and your connection to the server',
				'error');
		}
	});
}


async function buildTable (ports) {
	remove(document.querySelectorAll('tr td'));
	if (!ports) {
		await settings.pull();
		ports = settings.get('ports');
	}

	for (const port of ports) {
		const row = new Jui(`
			<tr class="row_port_${port.port}">
				<td>
					${port.port}
				</td>
				<td>
					${port.module || 'No module'}
				</td>
				<td>
					${port.active ? 'Yes' : 'No'}
				</td>
			</tr>
		`)
		.appendTo(table);
		row.append(new Jui(`
			<td id="button-edit-${port.port}" class="clickable">
				Edit
			</td>
		`).on('click', () => {
			editPort(port, 'edit')
		}))
		.append(new Jui(`
			<td id="button-delete-${port.port}" class="clickable">
				Delete
			</td>
		`).on('click', () => {
			updatePort(port, 'delete');
		}));
	}
}


function editPort(port, action) {
	new Jui('<div id="main-fade"></div>')
	.on('click', closePopup)
	.appendTo(main);


	new Jui(`
		<div id="popup"></div>
	`).append(new Jui(`
		<form>
			<label class="title">${action !== 'add' ? 'Edit port ' + port.port : 'Add new port'}</label>
			<label for="edit-port-number" class="subtitle">Port number</label>
			<input id="edit-port-number" type="number" placeholder="${port.port}">
			<label for="edit-port-module">Module ("None" to disable)</label>
			<input id="edit-port-module" type="text" placeholder="${port.module || 'None'}">
			<label for="edit-port-active">Active</label>
			<input id="edit-port-active" type="checkbox" checked="${port.active}">
			<input id="edit-port-save" type="button" value="${action !== 'add' ? 'Update' : 'Add'}">
		</form>
	`))
	.appendTo(main);

	new Jui('#edit-port-save')
	.on('click', () => {
		updatePort({
			id: port.id,
			port: new Jui('#edit-port-number').val(),
			module: new Jui('#edit-port-module').val(),
			active: document.querySelector('#edit-port-active').checked
		}, action);
	});

	new Jui('#edit-port-number')
	.on('change', e => {
		const number = parseInt(e.currentTarget.value);
		if (number < 0 || number > 65535) {
			notify.tell('Invalid port number',
				'Port number must be between 0 and 65535',
				'warning');
		}
	});
}


addEventListener('load', () => {
	new Jui(`
		<p class="clickable">
			Add new port
		</p>
	`)
	.appendTo(tab)
	.on('click', () => {
		editPort(defaultPort, 'add');
	});

	buildTable();
});
