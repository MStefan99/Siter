statusInfoField = document.getElementById('status-field')
portContainer = document.getElementById('port-container')
directoryContainer = document.getElementById('directory-container')
vhostContainer = document.getElementById('vhost-container')
includesContainer = document.getElementById('include-container')
logFileField = document.getElementById('log-file-field')
logFormatContainer = document.getElementById('log-format-container')
timeoutField = document.getElementById('timeout-field')
keepAliveField = document.getElementById('keepalive-field')
maxKeepAliveRequestsField = document.getElementById('maxkeepaliverequests-field')
keepAliveTimeoutField = document.getElementById('keepalivetimeout-field')
serverSignature = document.getElementById('server-signature-field')
serverTokens = document.getElementById('server-tokens-field')


import {notify} from './notifications.js'
import {buildMenu} from './menu.js'
import {ServerSettings} from './server_settings.js'
import {addElement} from './add_element.js'


new ServerSettings().pull().then((settings) ->
	if settings.get('status') is 'OK'
		statusInfoField.classList.add('good-status')
		statusInfoField.innerHTML = 'The server is running fine'
	else
		statusInfoField.innerHTML = settings.get('status')
		statusInfoField.classList.add('warning-status')
		notify('Server problem', 'There is a problem with server configuration.
			Please check this page for more details.', 'warning')

	for port in settings.get('ports')  # Populating ports section
		portElement = addElement
			parent: portContainer
			tag: 'li'
		addElement
			parent: portElement
			tag: 'h4'
			id: 'port_' + port['port']
			content: 'Port: ' + port['port']
		addElement
			parent: portElement
			tag: 'p'
			content: 'Module: ' + (port['module'] or 'no module')
		addElement
			parent: portElement
			tag: 'p'
			content: 'Port ' + if port['active'] then 'enabled' else 'disabled'

	for directory in settings.get('directories')  # Populating directory section
		directoryElement = addElement
			parent: directoryContainer
			tag: 'li'
			classes: 'directory'
		addElement
			parent: directoryElement
			tag: 'h4'
			id: 'directory_' + directory['path']
			content: "Directory <u>#{directory['path']}</u>"
		addElement
			parent: directoryElement
			tag: 'p'
			content: 'Directory ' + if directory['active'] then 'enabled' else 'disabled'
		addElement
			parent: directoryElement
			tag: 'p'
			content: 'Override ' + if directory['allowOverride'] then 'allowed' else 'prohibited'
		addElement
			parent: directoryElement
			tag: 'h5'
			id: 'rules-directory_' + directory['path']
			content: 'List of rules for directory'
		directoryRuleList = addElement
			parent: directoryElement
			tag: 'ol'
			classes: 'rules-list'

		for rule in directory['rules']
			ruleElement = addElement
				parent: directoryRuleList
				tag: 'li'
			addElement
				parent: ruleElement
				tag: 'p'
				content: "Type: #{rule['type']}"
			addElement
				parent: ruleElement
				tag: 'p'
				content: 'Rule ' + if rule['active'] then 'enabled' else 'disabled'
			addElement
				parent: ruleElement
				tag: 'p'
				content: 'Accessible: ' + if rule['allow'] then 'yes' else 'no'

			if rule['type'] is 'user'
				addElement
					parent: ruleElement
					tag: 'p'
					content: 'Users:'
				ruleUserList = addElement
					parent: ruleElement
					tag: 'ul'

				for user in rule['users']
					userElement = addElement
						parent: ruleUserList
						tag: 'li'
					addElement
						parent: userElement
						tag: 'p'
						content: user

			else if rule['type'] is 'ip'
				addElement
					parent: ruleElement
					tag: 'p'
					content: 'Ports: '
				ruleIpList = addElement
					parent: ruleElement
					tag: 'ul'

				for ip in rule['ips']
					ipElement = addElement
						parent: ruleIpList
						tag: 'li'
					addElement
						parent: ipElement
						tag: 'p'
						content: ip

	for vhost in settings.get('vhosts')  # Populating vhost section
		host = vhost['host'] or "#{vhost['ip']}:#{vhost['port']}"

		vhostElement = addElement
			parent: vhostContainer
			tag: 'li'
		addElement
			parent: vhostElement
			tag: 'h4'
			id: 'vhost_' + host
			content: "Host <u>#{host}</u>"
		addElement
			parent: vhostElement
			tag: 'a'
			content: 'Open'
			classes: 'button-link'
			options:
				'href': 'http://' + host
		addElement
			parent: vhostElement
			tag: 'p'
			content: 'Virtual Host ' + if vhost['active'] then 'enabled' else 'disabled'
		addElement
			parent: vhostElement
			tag: 'p'
			content: 'Document root: ' + vhost['documentRoot']

	for include in settings.get('includes')
		includeElement = addElement
			parent: includesContainer
			tag: 'li'
		addElement
			parent: includeElement
			tag: 'h4'
			id: 'include_' + include['path']
			content: 'File ' + include['path']
		addElement
			parent: includeElement
			tag: 'p'
			content: 'Optional: ' + if include['optional'] then 'yes' else 'no'

	logFileField.innerHTML = 'Error log file: ' + settings.get('log')['errorLog']
	for logFormat in settings.get('log')['logFormats']
		logElement = addElement
			parent: logFormatContainer
			tag: 'li'
		addElement
			parent: logElement
			tag: 'h5'
			id: 'log-format_' + logFormat['nickname']
			content: 'Format "' + logFormat['nickname'] + '"'
		addElement
			parent: logElement
			tag: 'p'
			content: 'Format: ' + logFormat['format']

	timeoutField.innerHTML = 'Request timeout: ' + settings.get('timeout')
	keepAliveField.innerHTML = 'Keep requests alive: ' + if settings.get('keepAlive') then 'yes' else 'no'
	maxKeepAliveRequestsField.innerHTML = 'Number of requests to keep alive: ' + settings.get('maxKeepAliveRequests')
	keepAliveTimeoutField.innerHTML = 'Keep requests alive for: ' + settings.get('keepAliveTimeout') + ' seconds'

	serverSignature.innerHTML = 'Server signature: ' + settings.get('serverSignature')
	serverTokens.innerHTML = 'Server tokens: ' + settings.get('serverTokens')

	buildMenu()
).catch((error) ->
	buildMenu()
	if error.message is 'Server not available'
		notify('Server offline', 'Server not available.
			Please make sure the server is running and reload this page.', 'error')
		statusInfoField.innerHTML = 'Backend not available!'
		statusInfoField.classList.add('bad-status')
		return

	else if error.message is 'Unexpected end of JSON input'
		statusInfoField.innerHTML = 'Invalid response from server'
		notify('Invalid response', 'The server has sent an invalid response.
			Please check the server version and contact the support.', 'error')
		statusInfoField.classList.add('bad-status')
		return
)
