const express = require('express');
const app = express();
const indexRouter = require('./views/index');

app.use(indexRouter);

app.listen(3000);
console.log('Listening on port 3000...');
