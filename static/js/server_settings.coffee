export class ServerSettings
	settings = {}

	fetch: ->
		res = await fetch('/get_settings/',
			method: 'GET'
		).catch(->
			throw new Error('Server not available')
		)

		JSON.stringify(settings) == await res.text()


	pull: ->
		res = await fetch('/get_settings/',
			method: 'GET'
		).catch(->
			throw new Error('Server not available')
		)

		settings = JSON.parse(await res.text())
		this


	get: (key) ->
		if not key?
			settings
		else
			settings[key]


	json: (key) ->
		if not key?
			JSON.stringify(settings)
		else
			JSON.stringify(settings[key])
