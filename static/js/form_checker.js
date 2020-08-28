// Generated by CoffeeScript 2.5.1
(function() {
  var checkComplexity, checkPasswords, form;

  form = document.querySelector('#login-form');

  form.code = document.querySelector('#login-form #sitercode');

  form.pwd = document.querySelector('#login-form #password');

  form.pwdRepeat = document.querySelector('#login-form #password-repeat');

  form.output = document.querySelector('#login-form #check');

  form.complexity = document.querySelector('#login-form #pwd-complexity');

  checkPasswords = function() {
    if (form.pwd.value || form.pwdRepeat.value) {
      if (form.pwd.value !== form.pwdRepeat.value) {
        return form.output.innerHTML = 'Passwords do not match!';
      } else {
        return form.output.innerHTML = '';
      }
    }
  };

  checkComplexity = function() {
    if (form.pwd.value.length >= 8) {
      if (form.pwd.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).*$/)) {
        form.complexity.innerHTML = 'Very strong password';
        return form.complexity.className = 'good-status';
      } else if (form.pwd.value.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)) {
        form.complexity.innerHTML = 'Strong password';
        return form.complexity.className = 'good-status';
      } else {
        form.complexity.innerHTML = 'Medium password';
        return form.complexity.className = 'warning-status';
      }
    } else {
      form.complexity.innerHTML = 'Weak password, not recommended';
      return form.complexity.className = 'bad-status';
    }
  };

  [form.pwd, form.pwdRepeat].forEach(function(item) {
    return item.addEventListener('keyup', function() {
      checkComplexity();
      return checkPasswords();
    });
  });

}).call(this);

//# sourceMappingURL=form_checker.js.map