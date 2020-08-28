const path = require('path');
const express = require('express');
const app = express();
const indexRouter = require('./src/routes/index');
const authRouter = require('./src/routes/auth');
const http = require('http');
const https = require('https');

const port = process.env.PORT || 80;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use('/', express.static(path.join(__dirname, 'static')));
app.use(authRouter);
app.use(indexRouter);


http.createServer((request, response) => {
	if (request.headers.host.match('siter')) {
		app(request, response);
	} else {
		response.statusCode = 404;
		response.write('Hello');
		response.end();
	}
}).listen(port);
