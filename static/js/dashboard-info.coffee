container = document.querySelector('#dashboard-container')

addEventListener('load', () ->
	res = await fetch('/dashboard_info/',
		method: 'POST'
	)
	parsedResponse = JSON.parse(await res.text())

	status = document.querySelector('#general-status')
	status.innerHTML = parsedResponse['status'].toUpperCase()
	if parsedResponse['status'] is 'ok'
		status.classList.add('good-status')
	portContainer = document.querySelector('#ports')
	portList = document.createElement('ol')

	portContainer.appendChild(portList)

	for port in parsedResponse['ports']
		portElement = document.createElement('li')
		portNumber = document.createElement('p')
		portNumber.innerHTML = 'Port: ' + port['port']
		portModule = document.createElement('p')
		portModule.innerHTML = 'Module: ' + if port['ifModule'] then port['ifModule'] else 'No module'
		portStatus = document.createElement('p')
		portStatus.innerHTML = 'Port ' + if port['on'] then 'enabled' else 'disabled'

		portList.appendChild(portElement)
		portElement.appendChild(portNumber)
		portElement.appendChild(portStatus)
		portElement.appendChild(portModule)

	directories = document.querySelector('#section-directories')
	directoryList = document.createElement('ol')

	directories.appendChild(directoryList)

	for directory in parsedResponse['directories']
		directoryElement = document.createElement('li')
		directoryElement.className = 'directory'
		directoryTitle = document.createElement('h4')
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

	vhosts = document.querySelector('#section-vhosts')
	vhostList = document.createElement('ol')

	vhosts.appendChild(vhostList)

	for vhost in parsedResponse['vhosts']
		vhostElement = document.createElement('li')
		vhostTitle = document.createElement('h4')
		vhostTitle.innerHTML = if vhost['host']
		then "Named Virtual Host <a href='https://#{vhost['host']}'>#{vhost['host']}</a>"
		else "Address Virtual Host <a href='https://#{vhost['ip']}:#{vhost['port']}'>#{vhost['ip']}:#{vhost['port']}</a>"
		vhostRoot = document.createElement('p')
		vhostRoot.innerHTML = 'Document root: ' + vhost['documentRoot']
		vhostStatus = document.createElement('p')
		vhostStatus.innerHTML = 'Virtual Host ' + if vhost['on'] then 'enabled' else 'disabled'

		vhostList.appendChild(vhostElement)
		vhostElement.appendChild(vhostTitle)
		vhostElement.appendChild(vhostStatus)
		vhostElement.appendChild(vhostRoot)
)

