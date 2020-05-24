import {Settings} from './settings.js'
import {addElement} from '../add_element.js'

table = document.querySelector('#ports-table')
body = document.querySelector('body')


remove = (elements) ->
	if elements?
		if Array.isArray(elements)
			for element in elements
				elements.parentNode.removeChild(elements)
		else
			elements.parentNode.removeChild(elements)


closePopup = ->
	remove(document.querySelector('#body-fade'))
	remove(document.querySelector('#popup, #popup *'))


editPort = (port) ->
	addElement
		parent: body
		id: 'body-fade'
		.addEventListener('click', closePopup)
	formContainer = addElement
		parent: body
		id: 'popup'
	form = addElement
		parent: formContainer
		tag: 'form'
	addElement
		parent: form
		tag: 'label'
		classes: 'title'
		content: 'Editing port ' + port['port']
	addElement
		parent: form
		tag: 'label'
		classes: 'subtitle'
		content: 'Port number'
	addElement
		parent: form
		tag: 'input'
		options:
			'type': 'text'
			'placeholder': port['port']
	addElement
		parent: form
		tag: 'input'
		options:
			'type': 'text'
			'placeholder': port['module'] || 'None'


Settings.then((settings) ->
	for port in settings.get('ports')
		do (port) ->
			row = addElement
				parent: table
				tag: 'tr'
				classes: 'row_port_' + port['port']
			addElement
				parent: row
				tag: 'td'
				content: port['port']
			addElement
				parent: row
				tag: 'td'
				content: port['module'] or 'No module'
			addElement
				parent: row
				tag: 'td'
				content: if port['on'] then 'Yes' else 'No'
			addElement
				parent: row
				id: 'button-edit-' + port['port']
				tag: 'td'
				content: 'Edit'
				.addEventListener('click', ->
				editPort(port)
			)
			addElement
				parent: row
				id: 'button-delete-' + port['port']
				tag: 'td'
				content: 'Delete'
)