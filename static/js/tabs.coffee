tabs = document.getElementsByClassName('tab')
tabContainer = document.getElementById('tab-container')
import {buildMenu} from './menu.js'
import {addElement} from './add_element.js'


openTab = () ->
	prevTab = document.querySelector('.tab-selected')
	if prevTab?
		prevTab.classList.remove('tab-selected')
		prevContent = document.getElementById(prevTab.id.replace('tab-selector', 'tab'))
		prevContent.classList.remove('tab-selected')

	this.classList.add('tab-selected')
	content = document.getElementById(this.id.replace('tab-selector', 'tab'))
	content.classList.add('tab-selected')
	buildMenu()


for tab in tabs
	tabSelector = addElement
		parent: tabContainer
		tag: 'div'
		id: tab.id.replace('tab', 'tab-selector')
		classes: 'tab-selector'

	if tab.classList.contains('tab-selected')
		tabSelector.classList.add('tab-selected')

	addElement
		parent: tabSelector
		tag: 'p'
		content: document.querySelector('#' + tab.id + ' h1').innerHTML

	tabSelector.addEventListener('click', openTab)


