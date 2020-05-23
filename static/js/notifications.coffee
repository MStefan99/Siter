notificationContainer = document.querySelector('#notification-container')

export notify = (title, info, type) ->
	if type isnt 'ok' and type isnt 'warning' and type isnt 'error'
		err = new TypeError()
		err.message = 'No such notification type'
		throw err

	notificationElement = document.createElement('div')
	notificationElement.classList.add('notification', 'notification-' + type)
	notificationContainer.appendChild(notificationElement)

	notificationButton = document.createElement('div')
	notificationButton.classList.add('notification-close')
	notificationButton.innerHTML = 'x'
	notificationButton.addEventListener('click', close)
	notificationElement.appendChild(notificationButton)

	notificationTitle = document.createElement('h2')
	notificationTitle.classList.add('notification-title')
	notificationTitle.innerHTML = title
	notificationElement.appendChild(notificationTitle)

	notificationInfo = document.createElement('p')
	notificationInfo.classList.add('notification-info')
	notificationInfo.innerHTML = info
	notificationElement.appendChild(notificationInfo)

	setTimeout(->
		notificationElement.classList.add('visible')
		100)
	return


remove = (element) ->
	element.classList.remove('visible')
	setTimeout(->
		element.parentNode.removeChild(element)
		500)
	return


close = ->
	remove(this.parentNode)
