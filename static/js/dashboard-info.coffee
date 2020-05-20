statusInfo = document.querySelector('#status-info')
portContainer = document.querySelector('#port-container')
directoryContainer = document.querySelector('#directory-container')
vhostContainer = document.querySelector('#vhost-container')
menuList = document.querySelector('#menu-container')


import {notify} from './notification.js'


addEventListener('load', ->
	res = await fetch('/dashboard_info/',
		method: 'POST'
	).catch(->
		notify('Server offline', 'Server not available.
			Please make sure the server is running and reload this page.', 'error')
		statusInfo.innerHTML = 'Backend not available!'
		statusInfo.classList.add('bad-status')
		return
	)
	try
		parsedResponse = JSON.parse(await res.text())
	catch err
		statusInfo.innerHTML = 'Invalid response from server!'
		notify('Invalid response', 'The server has sent an invalid response.
			Please check the server version and contact the support.', 'error')
		statusInfo.classList.add('bad-status')
		return

	if parsedResponse['status'] is 'OK'
		statusInfo.classList.add('good-status')
		statusInfo.innerHTML = 'Your server is running fine!'
	else
		statusInfo.innerHTML = parsedResponse['status']
		statusInfo.classList.add('warning-status')
		notify('Server problem', 'There is a problem with server configuration.
			Please check this page for more details.', 'warning')

	for port in parsedResponse['ports']  # Populating ports section
		portElement = document.createElement('li')
		portNumber = document.createElement('p')
		portNumber.innerHTML = 'Port: ' + port['port']
		portModule = document.createElement('p')
		portModule.innerHTML = 'Module: ' + if port['module'] then port['module'] else 'No module'
		portStatus = document.createElement('p')
		portStatus.innerHTML = 'Port ' + if port['on'] then 'enabled' else 'disabled'

		portContainer.appendChild(portElement)
		portElement.appendChild(portNumber)
		portElement.appendChild(portStatus)
		portElement.appendChild(portModule)

	for directory in parsedResponse['directories']  # Populating directory section
		directoryElement = document.createElement('li')
		directoryElement.className = 'directory'
		directoryTitle = document.createElement('h4')
		directoryTitle.id = 'directory_' + directory['path']
		directoryTitle.innerHTML = "Directory <u>#{directory['path']}</u>"
		directoryOverride = document.createElement('p')
		directoryOverride.innerHTML = 'Override ' + if directory['allowOverride'] then 'allowed' else 'prohibited'
		directoryRuleTitle = document.createElement('h5')
		directoryRuleTitle.innerHTML = 'List of rules for directory'
		directoryRuleList = document.createElement('ol')
		directoryRuleList.className = 'rules-list'
		directoryStatus = document.createElement('p')
		directoryStatus.innerHTML = 'Directory ' + if directory['on'] then 'enabled' else 'disabled'

		directoryContainer.appendChild(directoryElement)
		directoryElement.appendChild(directoryTitle)
		directoryElement.appendChild(directoryStatus)
		directoryElement.appendChild(directoryOverride)
		directoryElement.appendChild(directoryRuleTitle)
		directoryElement.appendChild(directoryRuleList)

		for rule in directory['rules']
			ruleElement = document.createElement('li')
			ruleType = document.createElement('p')
			ruleType.innerHTML = "Type: #{rule['type']}"
			ruleAllowed = document.createElement('p')
			ruleAllowed.innerHTML = 'Accessible: ' + if rule['allow'] then 'yes' else 'no'
			ruleStatus = document.createElement('p')
			ruleStatus.innerHTML = 'Rule ' + if rule['on'] then 'enabled' else 'disabled'

			directoryRuleList.appendChild(ruleElement)
			ruleElement.appendChild(ruleType)
			ruleElement.appendChild(ruleStatus)
			ruleElement.appendChild(ruleAllowed)

			if rule['type'] is 'user'
				ruleUserHeader = document.createElement('p')
				ruleUserHeader.innerHTML = 'Users:'
				ruleUserList = document.createElement('ul')

				ruleElement.appendChild(ruleUserHeader)
				ruleElement.appendChild(ruleUserList)

				for user in rule['users']
					userElement = document.createElement('li')
					userName = document.createElement('p')
					userName.innerHTML = user

					ruleUserList.appendChild(userElement)
					userElement.appendChild(userName)

			else if rule['type'] is 'ip'
				ruleIpHeader = document.createElement('p')
				ruleIpHeader.innerHTML = 'Ports:'
				ruleIpList = document.createElement('ul')

				ruleElement.appendChild(ruleIpHeader)
				ruleElement.appendChild(ruleIpList)

				for ip in rule['ips']
					ipElement = document.createElement('li')
					ipAddress = document.createElement('p')
					ipAddress.innerHTML = ip

					ruleIpList.appendChild(ipElement)
					ipElement.appendChild(ipAddress)

	for vhost in parsedResponse['vhosts']  # Populating vhost section
		vhostElement = document.createElement('li')
		vhostTitle = document.createElement('h4')
		host = if vhost['host']  then vhost['host'] else "#{vhost['ip']}:#{vhost['port']}"
		vhostTitle.id = 'vhost_' + host
		vhostTitle.innerHTML = "Host <u>#{host}</u>"
		vhostLink = document.createElement('a')
		vhostLink.href = 'http://' + vhostLink.innerHTML = host
		vhostRoot = document.createElement('p')
		vhostRoot.innerHTML = 'Document root: ' + vhost['documentRoot']
		vhostStatus = document.createElement('p')
		vhostStatus.innerHTML = 'Virtual Host ' + if vhost['on'] then 'enabled' else 'disabled'

		vhostContainer.appendChild(vhostElement)
		vhostElement.appendChild(vhostTitle)
		vhostElement.appendChild(vhostLink)
		vhostElement.appendChild(vhostStatus)
		vhostElement.appendChild(vhostRoot)

	headerList = document.querySelectorAll('h1,h3,h4')
	for header in headerList  # Building Navigation Menu
		menuElement = document.createElement('li')
		menuLink = document.createElement('a')
		menuLink.href = '#' + header.id
		menuLink.innerHTML = header.innerHTML

		if header.tagName == 'H4'
			menuElement.classList.add('sub-element')

		menuList.appendChild(menuElement)
		menuElement.appendChild(menuLink)
)
