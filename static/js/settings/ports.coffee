import {ServerSettings} from '../server_settings.js'
import {addElement} from '../add_element.js'
import {notify} from '../notifications.js'

table = document.querySelector('#ports-table')
main = document.querySelector('main')


remove = (elements) ->
	if elements?
		if elements.parentNode?
			elements.parentNode.removeChild(elements)
		else
			for element in elements
				element.parentNode.removeChild(element)


closePopup = ->
	remove(document.querySelector('#main-fade'))
	remove(document.querySelector('#popup, #popup *'))


settings = new ServerSettings()


buildTable = (ports) ->
	remove(document.querySelectorAll('tr td'))

	if not ports?
		await settings.pull()
		ports = settings.get('ports')

	for port in ports
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
				content: if port['active'] then 'Yes' else 'No'
			addElement(
				parent: row
				id: 'button-edit-' + port['port']
				tag: 'td'
				content: 'Edit'
			).addEventListener('click', ->
				editPort(port)
			)
			addElement
				parent: row
				id: 'button-delete-' + port['port']
				tag: 'td'
				content: 'Delete'


editPort = (port) ->
	addElement(
		parent: main
		id: 'main-fade'
	).addEventListener('click', closePopup)
	formContainer = addElement
		parent: main
		id: 'popup'
	form = addElement
		parent: formContainer
		tag: 'form'
		options:
			'submit': false
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
	addElement(
		parent: form
		tag: 'input'
		options:
			'type': 'number'
			'placeholder': port['port']
	).addEventListener('change', ->
		port['port'] = parseInt(this.value)
		console.log(port)
	)
	addElement
		parent: form
		tag: 'label'
		classes: 'subtitle'
		content: 'Module ("None" to disable)'
	addElement(
		parent: form
		tag: 'input'
		options:
			'type': 'text'
			'placeholder': port['module'] || 'None'
	).addEventListener('change', ->
		port['module'] = if this.value isnt 'None' then this.value else null
		console.log(port)
	)
	addElement
		parent: form
		tag: 'label'
		classes: 'subtitle'
		content: 'Active'
	addElement(
		parent: form
		tag: 'input'
		options:
			'type': 'checkbox'
			'checked': port['active']
	).addEventListener('change', ->
		port['active'] = this.checked
		console.log(port)
	)
	addElement(
		parent: form
		tag: 'input'
		options:
			'type': 'button'
			'value': 'Update'
	).addEventListener('click', ->
		fetch('/settings/ports/' + port['id'],
			method: 'POST'
			headers: {
				'Content-Type': 'application/json;charset=utf-8'
			}
			body: JSON.stringify(port)
		).then((res) ->
			if res.ok
				closePopup()
				notify('Port updated', 'Port info was updated successfully!', 'ok', false)
				closePopup()
				buildTable(await res.json())
			else
				notify('Error occurred', 'Port info was not updated due to the
							 error while communicating with the server', 'error', false)
		)
	)


buildTable()
