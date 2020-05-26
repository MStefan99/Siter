import {addElement} from './add_element.js'

notificationContainer = document.querySelector('#notification-container')

export notify = (title, info, type, persistent = true) ->
	if type isnt 'ok' and type isnt 'warning' and type isnt 'error'
		err = new TypeError()
		err.message = 'No such notification type'
		throw err

	notificationElement = addElement
		parent: notificationContainer
		classes: ['notification', 'notification-' + type]
	if persistent
		addElement(
			parent: notificationElement
			classes: 'notification-close'
			content: 'x'
		).addEventListener('click', ->
			remove(this.parentNode)
		)
	else
		setTimeout(->
			remove(notificationElement)
			return
			5000)
	addElement
		parent: notificationElement
		tag: 'h2'
		classes: 'notification-title'
		content: title
	addElement
		parent: notificationElement
		tag: 'p'
		classes: 'notification-info'
		content: info

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
