'use strict';

const statusInfoField = document.getElementById('status-field');
const portContainer = document.getElementById('port-container');
const directoryContainer = document.getElementById('directory-container');
const vhostContainer = document.getElementById('vhost-container');
const includesContainer = document.getElementById('include-container');
const logFileField = document.getElementById('log-file-field');
const logFormatContainer = document.getElementById('log-format-container');
const timeoutField = document.getElementById('timeout-field');
const keepAliveField = document.getElementById('keepalive-field');
const maxKeepAliveRequestsField = document.getElementById('maxkeepaliverequests-field');
const keepAliveTimeoutField = document.getElementById('keepalivetimeout-field');
const serverSignature = document.getElementById('server-signature-field');
const serverTokens = document.getElementById('server-tokens-field');


import * as notify from './notifications.js';
import createMenu from './menu.js';
import ServerSettings from './server_settings.js';
import Jui from '/js/jui.js';


new ServerSettings().pull().then((settings) => {
	if (settings.get('status') === 'OK') {
		statusInfoField.classList.add('good-status');
		statusInfoField.innerHTML = 'The server is running fine';
	} else {
		statusInfoField.innerHTML = settings.get('status');
		statusInfoField.classList.add('warning-status');
		notify.tell('Server problem',
			'There is a problem with server configuration. Please check this page for more details.',
			'warning');
	}
	for (const port of settings.get('ports')) {
		new Jui(`
			<li>
				<h4 id="port_${port.port}">
					${port.port}
				</h4>
				<p>
					Module: ${port.module || 'no module'}
				</p>
				<p>
					Port ${port.active ? 'enabled' : 'disabled'}
				</p>
			</li>
		`)
		.appendTo(portContainer);
	}
	for (const directory of settings.get('directories')) {
		const directoryElement = new Jui(`
			<li>
				<h4 id="directory_${directory.path}">
					Directory ${directory.path}
				</h4>
				<p>
					Directory ${directory.active ? 'enabled' : 'disabled'}
				</p>
				<p>
					Override ${directory.allowOverride ? 'allowed' : 'prohibited'}
				</p>
				<h5 id="directory-list_${directory.path}">
					List of rules for directory
				</h5>
			</li>
		`)
		.appendTo(directoryContainer);
		const directoryRuleList = new Jui(`<ol class="rules-list"/>`)
		.appendTo(directoryElement);


		for (const rule of directory.rules) {
			const ruleElement = new Jui(`
				<li>
					<p>
						Type: ${rule.type}
					</p>
					<p>
						Rule ${rule.active ? 'enabled' : 'disabled'}
					</p>
					<p>
						Allowed: ${rule.allow ? 'yes' : 'no'}
					</p>
				</li>
			`)
			.appendTo(directoryRuleList);

			if (rule.type === 'user') {
				new Jui(`
					<p>
						Users:
					</p>
				`)
				.appendTo(ruleElement);
				const ruleUserList = new Jui(`<ul/>`)
				.appendTo(ruleElement);

				for (const user of rule.entities) {
					new Jui(`
						<li>
							<p>
								${user}
							</p>
						</li>
					`)
					.appendTo(ruleUserList);
				}
			} else if (rule.type === 'ip') {
				new Jui(`
					<p>
						Ports: 
					</p>
				`)
				.appendTo(ruleElement);
				new Jui(`
					<p>
						Ports: 
					</p>
				`)
				.appendTo(ruleElement);
				const ruleIpList = new Jui(`<ul/>`)
				.appendTo(ruleElement);

				for (const ip of rule.entities) {
					new Jui(`
						<li>
							<p>
								${ip}
							</p>
						</li>
					`)
					.appendTo(ruleIpList);
				}
			}
		}
	}
	for (const vhost of settings.get('vhosts')) {
		const host = vhost.host || `${vhost.ip}:${vhost.port}`;

		new Jui(`
			<li>
				<h4 id="vhost_${host}">
					Host ${host}
				</h4>
				<a href="http://${host}" class="button-link">Open</a>
				<p>
					Virtual host ${vhost.active ? 'enabled' : 'disabled'}
				</p>
				<p>
					Document root: ${vhost.documentRoot}
				</p>
			</li>
		`)
		.appendTo(vhostContainer);
	}

	for (const file of settings.get('includes')) {
		new Jui(`
			<li>
				<h4 id="include_${file.path}">
					File ${file.path}
				</h4>
				<p>
					Optional: ${file.optional ? 'yes' : 'no'}
				</p>
			</li>
		`)
		.appendTo(includesContainer);
	}

	logFileField.innerHTML = 'Error log file: ' + settings.get('log').errorLog;
	for (const logFormat of settings.get('log').logFormats) {
		new Jui(`
			<li>
				<h5 id="log-format_${logFormat.nickname}">
					Format ${logFormat.nickname}
				</h5>
				<p>
					Format: ${logFormat.format}
				</p>
			</li>
		`)
		.appendTo(logFormatContainer);
	}
	timeoutField.innerHTML = 'Request timeout: ' + settings.get('timeout');
	keepAliveField.innerHTML = 'Keep requests alive: ' + (settings.get('keepAlive') ? 'yes' : 'no');
	maxKeepAliveRequestsField.innerHTML = 'Number of requests to keep alive: ' + settings.get('maxKeepAliveRequests');
	keepAliveTimeoutField.innerHTML = 'Keep requests alive for: ' + settings.get('keepAliveTimeout') + ' seconds';
	serverSignature.innerHTML = 'Server signature: ' + settings.get('serverSignature');
	serverTokens.innerHTML = 'Server tokens: ' + settings.get('serverTokens');
	return createMenu();
}).catch((error) => {
	createMenu();
	if (error.message === 'Server not available') {
		notify('Server offline', 'Server not available. Please make sure the server is running and reload this page.', 'error');
		statusInfoField.innerHTML = 'Backend not available!';
		statusInfoField.classList.add('bad-status');
	} else if (error.message === 'Unexpected end of JSON input') {
		statusInfoField.innerHTML = 'Invalid response from server';
		notify('Invalid response', 'The server has sent an invalid response. Please check the server version and contact the support.', 'error');
		statusInfoField.classList.add('bad-status');
	}
});
