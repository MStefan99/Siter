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

		else
			form.output.innerHTML = ''

checkComplexity = ->
	if form.pwd.value.length >= 8
		if form.pwd.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).*$/)
			form.complexity.innerHTML = 'Very strong password'
			form.complexity.className = 'good-status'
		else if form.pwd.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
			form.complexity.innerHTML = 'Strong password'
			form.complexity.className = 'good-status'
		else
			form.complexity.innerHTML = 'Medium password'
			form.complexity.className = 'warning-status'
	else
		form.complexity.innerHTML = 'Weak password, not recommended'
		form.complexity.className = 'bad-status'

[form.pwd, form.pwdRepeat].forEach((item) ->
	item.addEventListener('keyup', () ->
		checkComplexity()
		checkPasswords()
	)
)
