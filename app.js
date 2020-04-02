const express = require('express');
const app = express();
const indexRouter = require('./www/index');

app.set('view engine', 'pug');
app.use(indexRouter);

app.listen(3000, () => {
	console.log('Listening on port 3000...');
});
