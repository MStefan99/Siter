const path = require('path');
const express = require('express');
const app = express();
const indexRouter = require('./www/index');
const loginRouter = require('./www/login');


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));


app.use('/style', express.static('./static/css/'));
app.use(indexRouter);
app.use(loginRouter);


app.listen(3000, () => {
	console.log('Listening on port 3000...');
});
