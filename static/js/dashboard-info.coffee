statusInfoField = document.querySelector('#status-field')
portContainer = document.querySelector('#port-container')
directoryContainer = document.querySelector('#directory-container')
vhostContainer = document.querySelector('#vhost-container')
includesContainer = document.querySelector('#include-container')
logFileField = document.querySelector('#log-file-field')
logFormatContainer = document.querySelector('#log-format-container')
timeoutField = document.querySelector('#timeout-field')
keepAliveField = document.querySelector('#keepalive-field')
maxKeepAliveRequestsField = document.querySelector('#maxkeepaliverequests-field')
keepAliveTimeoutField = document.querySelector('#keepalivetimeout-field')
serverSignature = document.querySelector('#server-signature-field')
serverTokens = document.querySelector('#server-tokens-field')


import {notify} from './notifications.js'
import {buildMenu} from './menu.js'


addElement = ({
	parent,
	tag,
	id = null,
	classes = null,
	content = null,
	properties = null
}) ->
	if !tag?
		error = new TypeError()
		error.content = 'Tag is undefined'
		throw error

	newElement = document.createElement(tag)
	if id?
		newElement.id = id
	if content?
		newElement.innerHTML = content
	if classes?
		if Array.isArray(classes)
		then newElement.classList.add(...classes) else newElement.classList.add(classes)
	for property of properties
		newElement[property] = properties[property]
	if parent?
		parent.appendChild(newElement)

	return newElement


addEventListener('load', ->
	res = await fetch('/dashboard_info/',
		method: 'POST'
	).catch(->
		notify('Server offline', 'Server not available.
			Please make sure the server is running and reload this page.', 'error')
		statusInfoField.innerHTML = 'Backend not available!'
		statusInfoField.classList.add('bad-status')
		return
	)
	try
		parsedResponse = JSON.parse(await res.text())
	catch err
		statusInfoField.innerHTML = 'Invalid response from server'
		notify('Invalid response', 'The server has sent an invalid response.
			Please check the server version and contact the support.', 'error')
		statusInfoField.classList.add('bad-status')
		return

	if parsedResponse['status'] is 'OK'
		statusInfoField.classList.add('good-status')
		statusInfoField.innerHTML = 'The server is running fine'
	else
		statusInfoField.innerHTML = parsedResponse['status']
		statusInfoField.classList.add('warning-status')
		notify('Server problem', 'There is a problem with server configuration.
			Please check this page for more details.', 'warning')

	for port in parsedResponse['ports']  # Populating ports section
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
			content: 'Module: ' + if port['module'] then port['module'] else 'No module'
		addElement
			parent: portElement
			tag: 'p'
			content: 'Port ' + if port['on'] then 'enabled' else 'disabled'

	for directory in parsedResponse['directories']  # Populating directory section
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
			content: 'Directory ' + if directory['on'] then 'enabled' else 'disabled'
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
				content: 'Rule ' + if rule['on'] then 'enabled' else 'disabled'
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

	for vhost in parsedResponse['vhosts']  # Populating vhost section
		host = if vhost['host']  then vhost['host'] else "#{vhost['ip']}:#{vhost['port']}"

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
			properties:
				'href': 'http://' + host
		addElement
			parent: vhostElement
			tag: 'p'
			content: 'Virtual Host ' + if vhost['on'] then 'enabled' else 'disabled'
		addElement
			parent: vhostElement
			tag: 'p'
			content: 'Document root: ' + vhost['documentRoot']

	for include in parsedResponse['includes']
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

	logFileField.innerHTML = 'Error log file: ' + parsedResponse['log']['errorLog']
	for logFormat in parsedResponse['log']['logFormats']
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

	timeoutField.innerHTML = 'Request timeout: ' + parsedResponse['timeout']
	keepAliveField.innerHTML = 'Keep requests alive: ' + if parsedResponse['keepAlive'] then 'yes' else 'no'
	maxKeepAliveRequestsField.innerHTML = 'Number of requests to keep alive: ' + parsedResponse['maxKeepAliveRequests']
	keepAliveTimeoutField.innerHTML = 'Keep requests alive for: ' + parsedResponse['keepAliveTimeout'] + ' seconds'

	serverSignature.innerHTML = 'Server signature: ' + parsedResponse['serverSignature']
	serverTokens.innerHTML = 'Server tokens: ' + parsedResponse['serverTokens']

	buildMenu()
)
