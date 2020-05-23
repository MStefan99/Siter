import {Settings} from './settings.js'
import {addElement} from '../add_element.js'

table = document.querySelector('#ports-table')

Settings.then((settings) ->
	for port in settings.get('ports')
		row = addElement
			parent: table
			tag: 'tr'
			classes: 'row_port_' + port['port']
		addElement
			parent: row
			tag: 'td'
			content: 'Port ' + port['port']
		addElement
			parent: row
			tag: 'td'
			content: 'Module: ' + (port['module'] or 'no module')
		addElement
			parent: row
			tag: 'td'
			content: if port['on'] then 'Yes' else 'No'
		addElement
			parent: row
			tag: 'td'
			content: 'Edit'
		addElement
			parent: row
			tag: 'td'
			content: 'Delete'
)