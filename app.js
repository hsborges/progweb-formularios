var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var Datastore = require('nedb');
var morgan = require('morgan');
var split = require('split');

var db = {
  users: new Datastore({ filename: '.database/users.db', autoload: true }),
  logs: new Datastore({ filename: '.database/logs.db', autoload: true })
};


var indexRouter = require('./routes/index')(db);
var loginRouter = require('./routes/login');
var usersRouter = require('./routes/users')(db);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var logStream = split().on('data', (data) => {
  db.logs.insert({ type: 'log', data });
  app.get('socket.io').emit('log', data);
});
app.use(morgan('combined', { stream: logStream }));

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

setTimeout(function() {
  app.get('socket.io').on('connection', function(socket) {
    console.log('A user connected');
    socket.on('stats', function(callback) {
      db.users.count({}, function(err, users_count) {
        db.logs.count({ type: 'log' }, function(err, logs_count) {
          db.logs.count({ type: 'login' }, function(err, login_count) {
            callback({ users_count, logs_count, login_count });
          });
        });
      });
    });
  });
})

module.exports = app;
