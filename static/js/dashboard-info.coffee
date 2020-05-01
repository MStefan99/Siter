container = document.querySelector('#dashboard-container')

addEventListener('load', () ->
	res = await fetch('/dashboard_info/',
		method: 'POST'
	)
	obj = JSON.parse(await res.text())

	node = document.createElement('div')
	node.id = 'status'
	node.innerHTML = obj['status']
	container.appendChild(node)

	for element in obj['vhosts']
		node = document.createElement('div')
		node.className = 'vhost'
		node.innerHTML = element['host']
		container.appendChild(node)
)