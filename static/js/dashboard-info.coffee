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
	port = document.querySelector('#general-port')
	port.innerHTML = parsedResponse['port']

	directories = document.querySelector('#section-directories')
	directoryList = document.createElement('ol')
	directories.appendChild(directoryList)

	for directory in parsedResponse['directories']
		directoryElement = document.createElement('li')
		directoryElement.className = 'directory'

		title = document.createElement('h4')
		title.innerHTML = "Directory <u>#{directory['path']}</u>"
		directoryElement.appendChild(title)

		override = document.createElement('p')
		override.innerHTML = 'Override ' + if directory['allowOverride'] then 'allowed.' else 'prohibited.'
		directoryElement.appendChild(override)

		rules = document.createElement('h5')
		rules.innerHTML = 'List of rules for directory'
		directoryElement.appendChild(rules)

		ruleList = document.createElement('ol')
		ruleList.className = 'rules-list'

		for rule in directory['rules']
			ruleElement = document.createElement('li')

			type = document.createElement('p')
			type.innerHTML = "Type: #{rule['type']}"
			ruleElement.appendChild(type)

			allowed = document.createElement('p')
			allowed.innerHTML = 'Accessible: ' + if rule['allow'] then 'yes' else 'no'
			ruleElement.appendChild(allowed)
			ruleList.appendChild(ruleElement)

			#TODO: add users and ips to corresponding rules

		directoryElement.appendChild(ruleList)
		directoryList.appendChild(directoryElement)

)

