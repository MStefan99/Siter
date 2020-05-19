container = document.querySelector('#dashboard-container')
status = document.querySelector('#general-status')
directories = document.querySelector('#section-directories')
portContainer = document.querySelector('#ports')
vhosts = document.querySelector('#section-vhosts')
menuList = document.querySelector('#navigation-selector')


addEventListener('load', () ->
	res = await fetch('/dashboard_info/',
		method: 'POST'
	).catch(->
		status.innerHTML = 'Backend not available!'
		status.classList.add('bad-status')
	)
	try
		parsedResponse = JSON.parse(await res.text())
	catch err
		status.innerHTML = 'Invalid response from server!'
		status.classList.add('bad-status')
		return

	status.innerHTML = parsedResponse['status']
	if parsedResponse['status'] is 'OK'
		status.classList.add('good-status')
	else
		status.classList.add('warning-status')
	portList = document.createElement('ol')

	portContainer.appendChild(portList)

	for port in parsedResponse['ports']
		portElement = document.createElement('li')
		portNumber = document.createElement('p')
		portNumber.innerHTML = 'Port: ' + port['port']
		portModule = document.createElement('p')
		portModule.innerHTML = 'Module: ' + if port['module'] then port['module'] else 'No module'
		portStatus = document.createElement('p')
		portStatus.innerHTML = 'Port ' + if port['on'] then 'enabled' else 'disabled'

		portList.appendChild(portElement)
		portElement.appendChild(portNumber)
		portElement.appendChild(portStatus)
		portElement.appendChild(portModule)

	directoryList = document.createElement('ol')

	directories.appendChild(directoryList)

	for directory in parsedResponse['directories']
		directoryElement = document.createElement('li')
		directoryElement.className = 'directory'
		directoryTitle = document.createElement('h4')
		directoryTitle.id = 'directory-' + directory['path']
		directoryTitle.innerHTML = "Directory <u>#{directory['path']}</u>"
		directoryOverride = document.createElement('p')
		directoryOverride.innerHTML = 'Override ' + if directory['allowOverride'] then 'allowed' else 'prohibited'
		directoryRuleTitle = document.createElement('h5')
		directoryRuleTitle.innerHTML = 'List of rules for directory'
		directoryRuleList = document.createElement('ol')
		directoryRuleList.className = 'rules-list'
		directoryStatus = document.createElement('p')
		directoryStatus.innerHTML = 'Directory ' + if directory['on'] then 'enabled' else 'disabled'

		directoryList.appendChild(directoryElement)
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

	vhostList = document.createElement('ol')

	vhosts.appendChild(vhostList)

	for vhost in parsedResponse['vhosts']
		vhostElement = document.createElement('li')
		vhostTitle = document.createElement('h4')
		host = if vhost['host']  then vhost['host'] else "#{vhost['ip']}:#{vhost['port']}"
		vhostTitle.id = 'vhost-' + host
		vhostTitle.innerHTML = "Host <u>#{host}</u>"
		vhostLink = document.createElement('a')
		vhostLink.href = 'http://' + vhostLink.innerHTML = host
		vhostRoot = document.createElement('p')
		vhostRoot.innerHTML = 'Document root: ' + vhost['documentRoot']
		vhostStatus = document.createElement('p')
		vhostStatus.innerHTML = 'Virtual Host ' + if vhost['on'] then 'enabled' else 'disabled'

		vhostList.appendChild(vhostElement)
		vhostElement.appendChild(vhostTitle)
		vhostElement.appendChild(vhostLink)
		vhostElement.appendChild(vhostStatus)
		vhostElement.appendChild(vhostRoot)

	# Building Navigation Menu
	headers = document.querySelectorAll('h1,h3,h4')
	for header in headers
		menuElement = document.createElement('li')
		menuLink = document.createElement('a')
		menuLink.href = '#' + header.id
		menuLink.innerHTML = header.innerHTML

		if header.tagName == 'H4'
			menuElement.classList.add('sub-element')

		menuList.appendChild(menuElement)
		menuElement.appendChild(menuLink)
)

