const path = require('path');
const express = require('express');
const app = express();
const {pagesRouter} = require('./src/pages');
const {authRouter} = require('./src/auth');
const {workerRouter} = require('./src/api/v0.1/workers');
const {portsRouter} = require('./src/ports');
const {directoriesRouter} = require('./src/directories');


const port = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.use('/style', express.static(path.join(__dirname, 'static/css')));
app.use('/js', express.static(path.join(__dirname, 'static/js')));
app.use(authRouter);
app.use(pagesRouter);
app.use(workerRouter);
app.use(portsRouter);
app.use(directoriesRouter);


app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
