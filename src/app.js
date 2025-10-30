const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { requestIdMiddleware } = require('./middlewares/requestId');
const { errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(requestIdMiddleware);

app.use('/', routes);

app.use(errorHandler);

module.exports = app;
