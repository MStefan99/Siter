import {Settings} from './settings.js'
#import

Settings.then((settings) ->
	console.log settings.json('ports')
	return
)