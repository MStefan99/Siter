tabs = document.getElementsByClassName('tab')
tabContainer = document.getElementById('tab-container')

openTab = () ->
	prevTab = document.querySelector('.tab-selected')
	if prevTab?
		prevTab.classList.remove('tab-selected')
		prevContent = document.getElementById(prevTab.id.replace('tab-selector', 'tab'))
		prevContent.style['display'] = 'none'

	this.classList.add('tab-selected')
	content = document.getElementById(this.id.replace('tab-selector', 'tab'))
	content.style['display'] = 'block'


for tab in tabs
	tabSelector = document.createElement('div')
	tabSelector.id = tab.id.replace('tab', 'tab-selector')
	tabSelector.classList.add('tab-selector', 'tab-selected' if tab.classList.contains('tab-selected'))
	tabContainer.appendChild(tabSelector)

	tabName = document.createElement('p')
	tabName.innerHTML = document.querySelector('#' + tab.id + ' h1').innerHTML
	tabSelector.appendChild(tabName)

	tabSelector.addEventListener('click', openTab)


