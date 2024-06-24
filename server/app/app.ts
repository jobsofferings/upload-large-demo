import express = require('express');
import path = require('path');

const port = 3001;
const defaultPath = './upload/';

const app: express.Application = express();

app.use(express.static(path.join(__dirname, defaultPath)));

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Headers', 'content-type,Content-Length, Authorization,Origin,Accept,X-Requested-With'); // 允许的请求头
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.listen(port, function () {
  console.info(`listening on port ${port}!`);
});

module.exports = app;