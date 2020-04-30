form = document.querySelector('#login-form')
form.code = document.querySelector('#login-form #sitercode')
form.pwd = document.querySelector('#login-form #password')
form.pwdRepeat = document.querySelector('#login-form #password-repeat')
form.output = document.querySelector('#login-form #check')
form.complexity = document.querySelector('#login-form #pwd-complexity')


checkPasswords = ->
	if form.pwd.value or form.pwdRepeat.value
		if form.pwd.value isnt form.pwdRepeat.value
			form.output.innerHTML = 'Passwords do not match!'
			form.pwd.style['border-color'] = '#f00'
			form.pwdRepeat.style['border-color'] = '#f00'
			form.output.style['color'] = '#f00'

		else
			form.output.innerHTML = ''
			form.pwd.style['border-color'] = '#0f0'
			form.pwdRepeat.style['border-color'] = '#0f0'

checkComplexity = ->
	if form.pwd.value.length > 8
		if form.pwd.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).*$/)
			form.complexity.innerHTML = 'Very strong password'
		else if form.pwd.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
			form.complexity.innerHTML = 'Strong password'
		else
			form.complexity.innerHTML = 'Medium password'
	else
		form.complexity.innerHTML = 'Weak password, not recommended'

[form.pwd, form.pwdRepeat].forEach((item) ->
	item.addEventListener('keyup', () ->
		checkComplexity()
		checkPasswords()
	)
)
