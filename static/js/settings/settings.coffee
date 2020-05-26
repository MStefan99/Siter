import {buildMenu} from '../menu.js'
import {addElement} from '../add_element.js'


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
		loadScript(tab)
	else
		tab.addEventListener('click', ->
			loadScript(this)
		)
