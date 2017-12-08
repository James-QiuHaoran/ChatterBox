var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var bodyParser = require('body-parser');
var chats = require('./routes/chats.js');

// Database Connection
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/assignment2');

// create
var app = express();

// configure body parser
app.use(bodyParser.json());                          // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));  // support encoded bodies

// other module loaded to support all middlewares
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(session({secret: 'RANDOMSTRINGGOESHERESEMAJ'}));
app.use(express.static(path.join(__dirname, 'public')));

// make our db accessible to our router
app.use(function(req,res,next){
	req.db = db;
	next();
});

// use chats.js to handle requests for localhost:3000
app.use('/', chats);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({'error': err});
});

module.exports = app;