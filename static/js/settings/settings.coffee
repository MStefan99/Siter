import {ServerSettings} from '../server_settings.js'
import {buildMenu} from '../menu.js'
import {addElement} from '../add_element.js'

export Settings = new ServerSettings().pull()
buildMenu()

tabs = document.getElementsByClassName('tab-selector')
main = document.querySelector('main')


loadScript = (tab) ->
	addElement
		parent: main
		tag: 'script'
		id: tab.id.replace('tab-selector-', '') + '-script'
		options:
			'type': 'module'
			'src': '../js/settings/' + tab.id.replace('tab-selector-', '') + '.js'


for tab in tabs
	if tab.classList.contains('tab-selected')
		loadScript(this)
	else
		tab.addEventListener('click', ->
			loadScript(this)
		)
