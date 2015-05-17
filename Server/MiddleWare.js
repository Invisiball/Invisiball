// Set up paths.
App.Apps.Express.use('/', App.Modules.Express.static('/Html'.AssetPath));
App.Apps.Express.use('/Css', App.Modules.Express.static('/Css'.AssetPath));
App.Apps.Express.use('/Js', App.Modules.Express.static('/Js'.AssetPath));
App.Apps.Express.use('/Images', App.Modules.Express.static('/Images'.AssetPath));
App.Apps.Express.use('/Sounds', App.Modules.Express.static('/Sounds'.AssetPath));
App.Apps.Express.use('/Meshes', App.Modules.Express.static('/Meshes'.AssetPath));

// Set up 3rd-party middleware.
App.Apps.Express.use(App.Modules.CookieParser());
App.Apps.Express.use(App.Modules.BodyParser.json());
App.Apps.Express.use(App.Modules.BodyParser.urlencoded({ extended: true }));
App.Apps.Express.use(App.Modules.Session({
	resave: false,
	saveUninitialized: false,
	secret: 'yawk yawk yawk yawk', // Dat secret tho.
	key: 'express.sid',
	store: App.Databases.SessionStore
}));
App.Apps.Express.use(App.Modules.PassPort.initialize());
App.Apps.Express.use(App.Modules.PassPort.session());
App.Apps.Express.use(App.Apps.Express.router);

App.Apps.Express.enable('trust proxy');

// Set up our middleware.
App.Apps.Express.MiddleWare = Object.seal({
	AuthenticateUser: function(Request, Response, Done) {
		if (!Request.user) { // If no user is logged in, force login.
			Response.redirect('/Me/Login?Error=Login First');
			return;
		}

		Done(); // Bye bye.
	}, /**< Checks if user is authenticated. */
	CheckForMaintenance: function(Request, Response, Done) {
		if (App.Configs.Global.IsMaintaining) { // If is maintaining, all processes must be stopped.
			Response.redirect('/Maintenance');
			return;
		}

		Done(); // Bye bye.
	} /**< Check if server is under maintenance. */
});

module.exports = null;
