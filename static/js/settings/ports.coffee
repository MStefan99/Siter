import {ServerSettings} from '../server_settings.js'
import {addElement} from '../add_element.js'
import {notify} from '../notifications.js'

main = document.querySelector('main')
tab = document.querySelector('#tab-ports')
table = document.querySelector('#ports-table')

defaultPort = {port: 80, module: null, active: false}


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

updatePort = (port, action) ->
	if action isnt 'add' and action isnt 'edit' and action isnt 'delete'
		throw new Error('No such action!')
	if action is 'delete'
		if not confirm("Are you sure to delete port #{port['port']}? This action cannot be undone!")
			return
	fetch('/settings/ports/' + action + '/' + (if action isnt 'add' then port['id'] else ''),
		method: 'POST'
		headers: {
			'Content-Type': 'application/json;charset=utf-8'
		}
		body: JSON.stringify(port)
	).then((res) ->
		if res.status is 200
			closePopup()
			notify('Port updated', 'Port info was updated successfully!', 'ok', false)
			closePopup()
			buildTable(await res.json())
		else if res.status is 403
			notify('No permission', 'This action can be performed by server administrator only.
							 Contact administrator to get admin permissions.', 'error', false)
		else
			notify('Cannot add port', 'Please check whether this port is already added
						 and your connection to the server', 'error', false)
	)


settings = new ServerSettings()


addElement(
	parent: tab
	tag: 'p'
	classes: 'clickable'
	content: 'Add new port'
).addEventListener('click', ->
	editPort(defaultPort, 'add')
)


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
				classes: 'clickable'
				content: 'Edit'
			).addEventListener('click', ->
				editPort(port, 'edit')
			)
			addElement(
				parent: row
				id: 'button-delete-' + port['port']
				tag: 'td'
				classes: 'clickable'
				content: 'Delete'
			).addEventListener('click', ->
				updatePort(port, 'delete')
			)


editPort = (port, action) ->
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
		updatePort(port, action)
	)


buildTable()
