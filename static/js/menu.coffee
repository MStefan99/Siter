import {addElement} from './add_element.js'

export buildMenu = ->
	menuList = document.querySelector('#menu-container')
	oldHeaderList = document.querySelectorAll('.menu-item')
	headerList = document.querySelectorAll(
		'#content-container .tab-selected h2,
		#content-container .tab-selected h3,
		#content-container .tab-selected h4,
		#content-container .tab-selected h5')

	if oldHeaderList?
		for oldHeader in oldHeaderList
			remove(oldHeader)

	for header in headerList
		menuElement = addElement
			parent: menuList
			tag: 'li'
			classes: ['menu-item', 'menu-' + header.tagName.toLowerCase()]
		menuLink = addElement
			parent: menuElement
			tag: 'a'
			options:
				'href': '#' + header.id
		addElement
			parent: menuLink
			tag: header.tagName
			content: header.innerHTML


remove = (element) ->
	element.parentNode.removeChild(element)

buildMenu()
