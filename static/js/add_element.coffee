export addElement = ({
	parent,
	tag,
	id = null,
	classes = null,
	content = null,
	options = null
}) ->
	if !tag?
		error = new TypeError()
		error.content = 'Tag is undefined'
		throw error

	if (id && document.getElementById(id))
		return

	newElement = document.createElement(tag)
	if id?
		newElement.id = id
	if content?
		newElement.innerHTML = content
	if classes?
		if Array.isArray(classes)
		then newElement.classList.add(...classes) else newElement.classList.add(classes)
	for option of options
		newElement[option] = options[option]
	if parent?
		parent.appendChild(newElement)

	newElement