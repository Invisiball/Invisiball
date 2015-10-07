module.exports = function initServerModule(config, db, app, express, session, cookieParser, passport) {
	var bodyParser = require('body-parser');
	var morgan = require('morgan');

	// Set up paths.
	app.use('/', express.static(config.assetPath + '/html'));
	app.use('/css', express.static(config.assetPath + '/css'));
	app.use('/js', express.static(config.assetPath + '/js'));
	app.use('/images', express.static(config.assetPath + '/images'));
	app.use('/sounds', express.static(config.assetPath + '/sounds'));
	app.use('/meshes', express.static(config.assetPath + '/meshes'));
	app.use('/maps', express.static(config.assetPath + '/maps'));

	// Set up 3rd-party middleware.
	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(session({
		resave: false,
		saveUninitialized: false,
		secret: 'yawk yawk yawk yawk', // Dat secret tho.
		key: 'express.sid',
		store: db.sessions
	}));
	app.use(passport.initialize());
	app.use(passport.session());
	config.isDebugging && app.use(morgan('combined'));

	app.enable('trust proxy');

	// Set up our middleware.
	app.middleware = {
		authUser: function(req, res, done) {
			if (!req.user) { // If no user is logged in, force login.
				res.redirect('/Me/Login?Error=Login First');
				return;
			}

			done(); // Bye bye.
		} /**< Checks if user is authenticated. */
	};

	// Must remain global if onUncaughtException is to work.
	var httpServer = require('http').createServer(app); /**< HTTP server. */

	// Create user in session.
	passport.serializeUser(function(user, done) {
		done(null, user);
	});

	// Save user session.
	passport.deserializeUser(function(user, done) {
		done(null, user);
	});

	httpServer.listen(config.address.port);
	log.info(`Listening on http://${config.address.url}:${config.address.port} (#${config.pid}).`);

	return httpServer;
};
