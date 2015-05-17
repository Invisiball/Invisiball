var hash = require('object-hash');

var utils = require('./utils');
var config = require('./config')(utils);
var db = require('./db')(config, hash);
var app = require('./http')(config, utils, utils.log, db);

var socket = null;
app.listen(function() {
	socket = require('./socket')(config, utils, db, app.http, app.store, app.cookieParser);
});

process.on('uncaughtException', function(err) {
	utils.log.fatal('Uncaught exception: %s', err.stack);
	process.exit(1);
});

process.on('SIGINT', function() {
	utils.log.warn('Terminating due to user intervention...');
	process.exit(0);
});

process.on('exit', function(code) {
	utils.log.fatal('Exiting with code %s.', code);
});
