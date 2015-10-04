// Set up paths.
App.Apps.Express.use('/', App.Modules.Express.static(App.Configs.AssetPath + '/Html'));
App.Apps.Express.use('/Css', App.Modules.Express.static(App.Configs.AssetPath + '/Css'));
App.Apps.Express.use('/Js', App.Modules.Express.static(App.Configs.AssetPath + '/Js'));
App.Apps.Express.use('/Images', App.Modules.Express.static(App.Configs.AssetPath + '/Images'));
App.Apps.Express.use('/Sounds', App.Modules.Express.static(App.Configs.AssetPath + '/Sounds'));
App.Apps.Express.use('/Meshes', App.Modules.Express.static(App.Configs.AssetPath + '/Meshes'));
App.Apps.Express.use('/Maps', App.Modules.Express.static(App.Configs.AssetPath + '/Maps'));

// Set up 3rd-party middleware.
App.Apps.Express.use(App.Modules.Express.cookieParser());
App.Apps.Express.use(App.Modules.Express.json());
App.Apps.Express.use(App.Modules.Express.urlencoded());
App.Apps.Express.use(App.Modules.Express.session({
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
