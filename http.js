module.exports = function(config, utils, log, db) {
	var express = require('express');
	var app = express();
	var http = require('http').createServer(app);
	// var https = require('https').createServer(config.ssl, app);

	var passport = require('passport');
	var passportLocal = require('passport-local');

	var session = require('express-session');
	var bodyParser = require('body-parser');
	var cookieParser = require('cookie-parser');
	var errorHandler = require('errorHandler');

	var MongoStore = require('connect-mongo')(session);
	var sessionStore = new MongoStore({ mongooseConnection: db.mongoose.connection });

	app.enable('trust proxy');

	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(session({
		resave: false,
		unset: 'destroy',
		saveUninitialized: false,
		secret: config.secret,
		store: sessionStore
	}));

	app.use(passport.initialize());
	app.use(passport.session());

	passport.use(new passportLocal.Strategy(function(username, password, next) {
			password = utils.whirlpool(password);

			db.players.findOne({ username: username, password: password }, function(error, user) {
				if (error) {
					return next(null, false, { message: error }, 500);
				}

				if (!user) {
					return next(null, false, new Error('Incorrect username or password.'), null);
				}

				return next(null, user, undefined);
			});
		}
	));

	passport.serializeUser(function(user, next) {
		next(null, user);
	});

	passport.deserializeUser(function(user, next) {
		db.players.findOne({ _id: user._id }, function(error, user) {
			if (error) {
				next(error);
			}

			next(null, user);
		});
	});

	app.set('view engine', 'ejs');
	app.set('views', __dirname + '/views');
	app.use(express.static(__dirname + '/public'));
	app.use('/', require('./routes/index')(utils, db, passport));
	if (config.dev) {
		errorHandler.title = 'Oops!';
		app.use(errorHandler({ log: false }));
	}

	return {
		app: app,
		http: http,
		passport: passport,
		store: sessionStore,
		cookieParser: cookieParser,
		listen: function(callback) {
			http.listen(config.http_port, function() {
				log.debug('HTTP: Listening on http://localhost:' + config.http_port + '/.');

				// https.listen(config.https_port, function() {
				// 	log.debug('HTTPS: Listening on https://localhost:' + config.https_port + '/.');

					callback();
				// });
			});
		}
	};
};
