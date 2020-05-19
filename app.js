const path = require('path');
const express = require('express');
const app = express();
const {pagesRouter} = require('./bin/www/pages');
const {authRouter} = require('./bin/www/auth');
const {workerRouter} = require('./bin/www/workers')


const port = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use('/style', express.static(path.join(__dirname, 'static/css')));
app.use('/js', express.static(path.join(__dirname, 'static/js')));
app.use(authRouter);
app.use(pagesRouter);
app.use(workerRouter);


app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
