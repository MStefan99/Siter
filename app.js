const path = require('path');
const express = require('express');
const app = express();
const indexRouter = require('./bin/www/pages');
const loginRouter = require('./bin/users/login');


const port = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '/views'));


app.use('/style', express.static('./static/css/'));
app.use(indexRouter);
app.use(loginRouter);


app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
