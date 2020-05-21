export buildMenu = ->
	menuList = document.querySelector('#menu-container')
	headerList = document.querySelectorAll('#content-container h2,
		#content-container h3,
		#content-container h4,
		#content-container h5')

	for header in headerList
		menuElement = document.createElement('li')
		menuElement.classList.add('menu-item', 'menu-' + header.tagName.toLowerCase())
		menuList.appendChild(menuElement)

		menuLink = document.createElement('a')
		menuLink.href = '#' + header.id
		menuElement.appendChild(menuLink)

		menuHeader = document.createElement(header.tagName)
		menuHeader.innerHTML = header.innerHTML
		menuLink.appendChild(menuHeader)
