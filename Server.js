/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Usandfriends
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

////////// INVISIBALL //////////

//========== BUILD APP ==========

// App skeleton.
global.App = {
	Apps: {}, /**< Stores mini-apps in app like Express. */
	Auths: {
		Google: {}, /**< Google authentication. */
		Facebook: {}, /**< Facebook authentication. */
		Twitter: {} /**< Twitter authentication. */
	}, /**< Authetications. */
	Configs: {
		Global: {
			Address: {} /**< Address to listen to configs. */
		} /**< Global configs. */
	}, /**< Configuration variables. */
	Console: {}, /**< Console stuff. */
	Databases: {}, /**< Databases. */
	Emails: {
		Google: {} /**< Google email. */
	}, /**< Admin / bot emails. */
	Jobs: {}, /**< CRON jobs. */
	Modules: {}, /**< Modules required. */
	Vars: {} /**< Variables and utilities. */
}; /**< Our app. */

//========== START UTIL VARS ==========

// Backend for getting line number... Ignore...
Object.defineProperty(App.Vars, 'Stack', {
	get: function() {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack) { return stack; };
		var err = new Error();
		Error.captureStackTrace(err, arguments.callee);
		var stack = err.stack;
		Error.prepareStackTrace = orig;
		return stack;
	}
});

// Return the current line number.
Object.defineProperty(App.Vars, 'LineNumber', {
	get: function() {
		return App.Vars.Stack[1].getLineNumber();
	}
});

/**
 * Replaces all find with replace.
 * @param find String to find.
 * @param replace String to replace found with.
 */
String.prototype.Replace = function(find, replace) {
	return this.replace(new RegExp(find, 'g'), replace);
};

/**
 * Makes a path from the string.
 */
Object.defineProperty(String.prototype, 'LocalFilePath', {
	get: function() {
		return __dirname + this;
	}
});

/**
 * Pretty-prints message with line number.
 */
App.Console.Log = function(line, t) {
	if (App.Configs.Global.IsDebugging) {
		console.log('[' + line.toString() + '] ' + t.toString());
	}
};

/**
 * Pretty-prints error with line number.
 */
App.Console.Error = function(line, t) {
	if (App.Configs.Global.IsDebugging) {
		console.error(('[' + line.toString() + '] ' + t.toString()).red);
	}
};

App.Console.Throw = function(line, t) {
	var getStackTrace = function() {
		var obj = {};
		Error.captureStackTrace(obj, getStackTrace);
		return obj.stack;
	};

	App.Console.Error(line, JSON.stringify(t, null, 4) + '\n' + getStackTrace().toString());

	process.exit(1);
}

//========== START NODEJS VARS ==========

App.Modules.Express = require('express'); /**< Express module. */
App.Modules.PassPort = require('passport'); /**< Passport module. */
App.Modules.SQLiteStore = require('connect-sqlite3')(App.Modules.Express); /**< SQLite3 session store. */
App.Databases.SessionStore = new App.Modules.SQLiteStore({ dir: '/Assets/Data'.LocalFilePath }); /**< Our SQLite3 session store. */
App.Apps.Express = App.Modules.Express(); /**< Our express app. */
App.Modules.FileSystem = require('fs'); /**< File system. */
App.Modules.Colors = require('colors'); /**< Colors for output. */
App.Modules.Swig = require('swig'); /**< SWIG templating. */
// App.Modules.SwigExtras = require('swig-extras'); /**< SWIG extra filters and tags. */
App.Modules.Cron = require('cron').CronJob; /**< CRON module. */
App.Modules.Whirlpool = require('./Assets/Js/Utils/Whirlpool.js'); /**< Whirlpool hash function. */

//========== START APP VARS & CONFIGS ==========

App.Configs.Global.IsDebugging = true; /**< Is debugging? */
App.Configs.Global.IsMaintaining = false; /**< Is maintaining? */

App.Configs.Global.PID = parseInt(Math.random() * ((10000000 + 1) - 0) + 0); /**< The PID of this server. */

App.Configs.Global.AdminSecret = App.Modules.Whirlpool(App.Configs.Global.PID).toString();

App.Configs.Global.Address.Port = process.env.PORT || 80; /**< Port to listen to. */
App.Configs.Global.Address.Url = 'localhost'; /**< Base URL to listen to. */

App.Vars.ResponseCodes = Object.freeze({
	Ok: 200, // Okay.
	NotFound: 404, // Could not find resource.
	IncorrectRequest: 400, // Incorrect request.
	Conflict: 409, // Conflict.
	Err: 500 // Internal error.
}); /**< Response code constants. */

App.Vars.ClientCodes = Object.freeze({
	Twitter: 1, // Twitter client code.
	Google: 2, // Google client code.
	Facebook: 3 // Facebook client code.
}); /**< Client code constants. */

App.Vars.Rooms = {}; /**< Room data. */

//========== START SQLITE JOBS ==========

App.Modules.SQLite3 = require('sqlite3').verbose(), /**< SQLite3 module. */
App.Databases.UserDatabase = new App.Modules.SQLite3.Database('/Assets/Data/Users.DataBase'.LocalFilePath); /**< SQLite3 database to store users. */

// Create table "users".
App.Databases.UserDatabase.serialize(function() {
	App.Databases.UserDatabase.run('CREATE TABLE IF NOT EXISTS Users (Email TEXT DEFAULT "", Username TEXT DEFAULT "", Kills INTEGER DEFAULT 0, Deaths INTEGER DEFAULT 0, Shots INTEGER DEFAULT 0, Id TEXT DEFAULT "", Client INTEGER DEFAULT 0)', function(Error) {
		if (Error) { // Error!
			App.Console.Throw(Error);
		}
	});
});

//========== START MAILER SETUP ==========

App.Modules.NodeMailer = require('nodemailer'); /**< Nodemailer module. */

// Set up mail.
App.Emails.Google.Account = {
	Email: '', // Enter your Gmail email ...
	Password: '' // ... and password.
};

App.Emails.Google.Emailer = App.Modules.NodeMailer.createTransport('SMTP', {
	service: 'Gmail',
	auth: {
		user: App.Emails.Google.Account.Email,
		pass: App.Emails.Google.Account.Password
	}
});

//========== START SERVER SETUP ==========

// Set up paths.
App.Apps.Express.use('/', App.Modules.Express.static('/Assets/Html'.LocalFilePath));
App.Apps.Express.use('/Css', App.Modules.Express.static('/Assets/Css'.LocalFilePath));
App.Apps.Express.use('/Js', App.Modules.Express.static('/Assets/Js'.LocalFilePath));
App.Apps.Express.use('/Images', App.Modules.Express.static('/Assets/Images'.LocalFilePath));
App.Apps.Express.use('/Sounds', App.Modules.Express.static('/Assets/Sounds'.LocalFilePath));
App.Apps.Express.use('/Meshes', App.Modules.Express.static('/Assets/Meshes'.LocalFilePath));
App.Apps.Express.use('/Maps', App.Modules.Express.static('/Assets/Maps'.LocalFilePath));

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

// Must remain global if onUncaughtException is to work.
App.Apps.HttpServer = require('http').createServer(App.Apps.Express); /**< HTTP server. */
App.Apps.SocketIO = require('socket.io').listen(App.Apps.HttpServer); /**< Socket.IO server. */
App.Modules.PassportSocketIO = require('passport.socketio'); /**< Passport for Socket.IO module. */
App.Modules.SocketIOSessions = require('socket-io.sessions'); /**< Sessions for Socket.IO module. */

// Set up Socket.IO sessions and passport.
App.Apps.SocketIO.set('authorization', App.Modules.SocketIOSessions({
	cookieParser: App.Modules.Express.cookieParser,
	key: 'express.sid',
	secret: 'yawk yawk yawk yawk',
	store: App.Databases.SessionStore
}, App.Modules.PassportSocketIO.authorize({
	cookieParser: App.Modules.Express.cookieParser,
	key: 'express.sid',
	secret: 'yawk yawk yawk yawk',
	store: App.Databases.SessionStore
})));

// Set up Socket.IO vars.
//App.Apps.SocketIO.set('transports', ['jsonp-polling']); // Forced to do this because of https://github.com/Automattic/socket.io/issues/430.
App.Apps.SocketIO.set('log level', /*App.Configs.Global.IsDebugging ? 3 : 1*/ 1); // Logging for or not for App.Configs.Global.IsDebugging.

// Start listening!
App.Apps.HttpServer.listen(App.Configs.Global.Address.Port);
App.Console.Log(App.Vars.LineNumber, ('Listening on http://' + App.Configs.Global.Address.Url.toString() + ':' + App.Configs.Global.Address.Port.toString() + '/ (#' + App.Configs.Global.PID.toString() + ').\n').grey);

//========== START PASSPORT AUTH SETUP ==========

// Create user in session.
App.Modules.PassPort.serializeUser(function(User, Done) {
	Done(null, User);
});

// Save user session.
App.Modules.PassPort.deserializeUser(function(User, Done) {
	Done(null, User);
});

//========== START GOOGLE AUTH SETUP ==========

// Google client data.
App.Auths.Google.ClientInfo = Object.freeze({
	Id: '', // Client ID.
	Secret: '', // Client secret.
	Redirect: 'http://' + App.Configs.Global.Address.Url + '/Auths/Google/Return' // Client redirect URL.
});

App.Auths.Google.Strategy = require('passport-google-oauth').OAuth2Strategy; /**< Google strategy. */

// Create Google auth.
App.Modules.PassPort.use(new App.Auths.Google.Strategy({
		clientID: App.Auths.Google.ClientInfo.Id, // Client ID
		clientSecret: App.Auths.Google.ClientInfo.Secret, // Client secret.
		callbackURL: App.Auths.Google.ClientInfo.Redirect // Client callback URL.
	}, function(AccessToken, RefreshToken, Profile, Done) {
		// Get the primary email.
		Profile.Email = Profile.emails[0].value;

		// Get the unique identifier.
		Profile.Identifier = Profile.Id = Profile.id;

		// Get other profile info.
		App.Databases.UserDatabase.serialize(function() {
			App.Databases.UserDatabase.all('SELECT * FROM Users WHERE Id="' + Profile.Id + '" LIMIT 1', function(Error, Rows) {
				if (Error) { // Error!
					App.Console.Throw(Error);
				}

				if (Rows.length !== 0) {
					Profile.Username = Rows[0].Username;
					Profile.Kills = Rows[0].Kills;
					Profile.Deaths = Rows[0].Deaths;
					Profile.Shots = Rows[0].Shots;
					Profile.Client = Rows[0].Client;
				} else {
					App.Databases.UserDatabase.run('INSERT INTO Users (Email, Id, Client) VALUES ("' + Profile.Email + '", "' + Profile.Id + '", "' + App.Vars.ClientCodes.Google + ')', function(Error) {
						if (Error) { // Error!
							App.Console.Throw(Error);
						}
					});
					Profile.Kills = 0;
					Profile.Deaths = 0;
					Profile.Shots = 0;
					Profile.Client = App.Vars.ClientCodes.Google;
				}

				return Done(null, Profile);
			});
		});
	}
));

//========== START FACEBOOK AUTH SETUP ==========

// Facebook client data.
App.Auths.Facebook.ClientInfo = Object.freeze({
	Id: '', // Client ID.
	Secret: '', // Client secret.
	Redirect: 'http://' + App.Configs.Global.Address.Url + '/Auths/Facebook/Return' // Client redirect URL.
});

App.Auths.Facebook.Strategy = require('passport-facebook').Strategy; /**< Facebook Auth. */

App.Modules.PassPort.use(new App.Auths.Facebook.Strategy({
	clientID: App.Auths.Facebook.ClientInfo.Id,
	clientSecret: App.Auths.Facebook.ClientInfo.Secret,
	callbackURL: App.Auths.Facebook.ClientInfo.Redirect
}, function(AccessToken, RefreshToken, Profile, Done) {
	// Get the primary email.
	Profile.Email = Profile.emails[0].value;

	// Get the unique identifier.
	Profile.Identifier = Profile.Id = Profile.id;

	// Get other profile info.
	App.Databases.UserDatabase.serialize(function() {
		App.Databases.UserDatabase.all('SELECT * FROM Users WHERE Id="' + Profile.Id + '" LIMIT 1', function(Error, Rows) {
			if (Error) { // Error!
				App.Console.Throw(Error);
			}

			if (Rows.length !== 0) {
				Profile.Username = Rows[0].Username;
				Profile.Kills = Rows[0].Kills;
				Profile.Deaths = Rows[0].Deaths;
				Profile.Shots = Rows[0].Shots;
				Profile.Client = Rows[0].Client;
			} else {
				App.Databases.UserDatabase.run('INSERT INTO Users (Email, Id, Client) VALUES ("' + Profile.Email + '", "' + Profile.Id + '", "' + App.Vars.ClientCodes.Facebook + ')', function(Error) {
					if (Error) { // Error!
						App.Console.Throw(Error);
					}
				});
				Profile.Kills = 0;
				Profile.Deaths = 0;
				Profile.Shots = 0;
				Profile.Client = App.Vars.ClientCodes.Facebook;
			}

			return Done(null, Profile);
		});
	});
}));

//========== START TWITTER AUTH SETUP ==========

// Twitter client data.
App.Auths.Twitter.ClientInfo = Object.freeze({
	Key: '', // Consumer ID.
	Secret: '', // Consumer secret.
	Redirect: 'http://' + App.Configs.Global.Address.Url + '/Auths/Twitter/Return' // Client redirect URL.
});

App.Auths.Twitter.Strategy = require('passport-twitter').Strategy; /**< Twitter Auth. */

App.Modules.PassPort.use(new App.Auths.Twitter.Strategy({
	consumerKey: App.Auths.Twitter.ClientInfo.Key,
	consumerSecret: App.Auths.Twitter.ClientInfo.Secret,
	callbackURL: App.Auths.Twitter.ClientInfo.Redirect
}, function(Token, TokenSecret, Profile, Done) {
	// Get the unique identifier.
	Profile.Identifier = Profile.Id = Profile.id;

	// Build profile.
	App.Databases.UserDatabase.serialize(function() {
		// Get other profile info.
		App.Databases.UserDatabase.all('SELECT * FROM Users WHERE Id="' + Profile.Id + '" LIMIT 1', function(Error, Rows) {
			if (Error) { // Error!
				App.Console.Throw(Error);
			}

			if (Rows.length !== 0) {
				Profile.Username = Rows[0].Username;
				// Profile.Email = Rows[0].Email;
				Profile.Kills = Rows[0].Kills;
				Profile.Deaths = Rows[0].Deaths;
				Profile.Shots = Rows[0].Shots;
				Profile.Client = Rows[0].Client;
			} else {
				// Check if Twitter username is taken.
				App.Databases.UserDatabase.all('SELECT * FROM Users WHERE Username="' + Profile.username + '" LIMIT 1', function(Error, Rows) {
					if (Error) { // Error!
						App.Console.Throw(Error);
					}

					if (Rows.length === 0) { // If is not taken, set username.
						Profile.Username = Profile.username;
						App.Databases.UserDatabase.run('INSERT INTO Users (Username, Id, Client) VALUES ("' + Profile.Username + '", "' + Profile.Id + '", "' + App.Vars.ClientCodes.Twitter + ')', function(Error) {
							if (Error) { // Error!
								App.Console.Throw(Error);
							}
						});
					} else { // Otherwise the user will have to pick another later.
						App.Databases.UserDatabase.run('INSERT INTO Users (Id, Client) VALUES ("' + Profile.Id + '", "' + App.Vars.ClientCodes.Twitter + ')', function(Error) {
							if (Error) { // Error!
								App.Console.Throw(Error);
							}
						});
					}

					// Default.
					Profile.Email = ''; // Twitter does not keep emails.
					Profile.Kills = 0;
					Profile.Deaths = 0;
					Profile.Shots = 0;
					Profile.Client = App.Vars.ClientCodes.Twitter;
				});
			}

			return Done(null, Profile);
		});
	});
}));

//========== START GOOGLE AUTH ROUTES ==========

// Authenticate user on this path.
App.Apps.Express.get('/Auths/Google', App.Apps.Express.MiddleWare.CheckForMaintenance, App.Modules.PassPort.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'] }), function(Request, Response) {});

// Redirect user according to return value.
App.Apps.Express.get('/Auths/Google/Return', App.Apps.Express.MiddleWare.CheckForMaintenance, App.Modules.PassPort.authenticate('google', { failureRedirect: '/?Error=Authentication Failed' }), function(Request, Response) {
	Response.redirect('/Auths/Google/Success');
});

// Authentication successful.
App.Apps.Express.get('/Auths/Google/Success', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (Request.user) { // If user is created, continue.
		if (!Request.user.Username) { // If they didn't set up their profile, set it up.
			Response.redirect('/Me/Profile/Finalize');
		} else { // Else go to main page.
			Response.redirect('/?Error=Welcome back ' + Request.user.Username + '!');
		}
	} else { // User is not logged in.
		res.redirect('/?Error=Login First');
	}
});

//========== START FACEBOOK AUTH ROUTES ==========

// Authenticate user on this path.
App.Apps.Express.get('/Auths/Facebook', App.Apps.Express.MiddleWare.CheckForMaintenance, App.Modules.PassPort.authenticate('facebook', { scope: ['public_profile', 'email'] }), function(Request, Response) {});

// Redirect user according to return value.
App.Apps.Express.get('/Auths/Facebook/Return', App.Apps.Express.MiddleWare.CheckForMaintenance, App.Modules.PassPort.authenticate('facebook', { failureRedirect: '/Me/Login/?Error=Authentication Failed' }), function(Request, Response) {
	Response.redirect('/Auths/Facebook/Success');
});

// Authentication successful.
App.Apps.Express.get('/Auths/Facebook/Success', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (Request.user) { // If user is created, continue.
		if (!Request.user.Username) { // If they didn't set up their profile, set it up.
			Response.redirect('/Me/Profile/Finalize');
		} else { // Else go to main page.
			Response.redirect('/?Error=Welcome back ' + Request.user.Username + '!');
		}
	} else { // User is not logged in.
		res.redirect('/?Error=Login First');
	}
});

//========== START TWITTER AUTH ROUTER ==========

// Authenticate user on this path.
App.Apps.Express.get('/Auths/Twitter', App.Apps.Express.MiddleWare.CheckForMaintenance, App.Modules.PassPort.authenticate('twitter'), function(Request, Response) {});

// Redirect user according to return value.
App.Apps.Express.get('/Auths/Twitter/Return', App.Apps.Express.MiddleWare.CheckForMaintenance, App.Modules.PassPort.authenticate('twitter', { failureRedirect: '/Me/Login/?Error=Authentication Failed' }), function(Request, Response) {
	Response.redirect('/Auths/Twitter/Success');
});

// Authentication successful.
App.Apps.Express.get('/Auths/Twitter/Success', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (Request.user) { // If user is created, continue.
		if (!Request.user.Username) { // If they didn't set up their profile, set it up.
			Response.redirect('/Me/Profile/Finalize');
		} else { // Else go to main page.
			Response.redirect('/?Error=Welcome back ' + Request.user.Username + '!');
		}
	} else { // User is not logged in.
		res.redirect('/?Error=Login First');
	}
});

//========== START /ME/* ROUTES ==========

// Main page.
App.Apps.Express.get('/Me', App.Apps.Express.MiddleWare.AuthenticateUser, App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Redirect to profile.
	Response.redirect('/Me/Profile');
});

// User wants to login.
App.Apps.Express.get('/Me/Login', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (Request.user) { // If user, redirect them to their profile.
		Response.redirect('/Me/Profile');
	} else {
		// Send login page.
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Main.html'.LocalFilePath, {
			IsAuthenticated: false, // Is authenticated?
			Me: Request.user, // Me
			Err: Response.req.query.Error // Error
		}));
	}
});

// Send profile's JSON object.
App.Apps.Express.get('/Me/JSON', App.Apps.Express.MiddleWare.AuthenticateUser, App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Send info.
	Response.send(Request.user);
});

// Pretty version of /Me/JSON.
App.Apps.Express.get('/Me/Profile', App.Apps.Express.MiddleWare.AuthenticateUser, App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Send info.
	Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Profile.html'.LocalFilePath, { // Send file.
		IsAuthenticated: true, // Is authenticated?
		Me: Request.user, // Me
		Err: Response.req.query.Error, // Error

		DidNotFindUser: false, // Did not find user?
		IsViewingSelf: true, // Is viewing self?
		User: Request.user // User found.
	}));
});

// Finalize profile.
App.Apps.Express.get('/Me/Profile/Finalize', App.Apps.Express.MiddleWare.AuthenticateUser, App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (Request.user.Username) { // User already has a username.
		Response.redirect('/?Error=You have already finalized your username, "' + Request.user.Username + '".');
	} else {
		if (Response.req.query.NewUsername) { // Is requesting username change.
			if (!(/^[a-z0-9]+$/i).test(Response.req.query.NewUsername) || Response.req.query.NewUsername.length < 8) { // Check for bad usernames.
				Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Finalize.html'.LocalFilePath, { // Send page.
					IsAuthenticated: true, // Is authenticated?
					Me: Request.user, // Me
					Err: 'Username "' + Response.req.query.NewUsername + '" is bad.' // Error
				}));
			} else {
				App.Databases.UserDatabase.serialize(function() {
					// Check if username is taken.
					App.Databases.UserDatabase.all('SELECT * FROM Users WHERE Username="' + Response.req.query.NewUsername + '" LIMIT 1', function(Error, Rows) {
						if (Error) { // Error!
							App.Console.Throw(Error);
						}

						if (Rows.length !== 0) { // Is taken.
							Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Finalize.html'.LocalFilePath, {
								IsAuthenticated: true, // Is authenticated?
								Me: Request.user, // Me
								Err: 'Username "' + Response.req.query.NewUsername + '" is taken.' // Error
							}));
						} else { // Is not, save username.
							Request._passport.session.user.Username = Response.req.query.NewUsername;
							App.Databases.UserDatabase.run('UPDATE Users SET Username="' + Response.req.query.NewUsername + '" WHERE Id="' + Request.user.Id + '"', function(Error) {
								if (Error) { // Error!
									App.Console.Throw(Error);
								}
							});
							Response.redirect('/Me/Profile/?Error=Success!');
						}
					});
				});
			}
		} else { // Requesting page, send page.
			Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Finalize.html'.LocalFilePath, {
				IsAuthenticated: true, // Is authenticated?
				Me: Request.user, // Me
				Err: Response.req.query.Error // Error
			}));
		}
	}
});

// User wants to logout.
App.Apps.Express.get('/Me/Logout', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (Request.user) { // User logged in, so log out.
		Request.logout();
		Response.redirect('/Me/Login/?Error=You have been successfully logged out!');
	} else { // No user to log out.
		Response.redirect('/Me/Login/?Error=Login First');
	}
});

//========== START MAIN ROUTES ==========

// Main page.
App.Apps.Express.get('/', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	var RoomData = [];
	if (Request.user) { // If user is logged in, compile rooms.
		for (var RoomName in App.Vars.Rooms) {
			if (App.Vars.Rooms.hasOwnProperty(RoomName)) {
				RoomData.push({ Name: RoomName, PlayerNumber: App.Apps.SocketIO.sockets.clients(RoomName).length, IsProtected: !!App.Vars.Rooms[RoomName].Password });
			}
		}
	}

	// Send page.
	Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Main.html'.LocalFilePath, {
		IsAuthenticated: !!Request.user, // Is authenticated?
		Me: Request.user, // Me
		Err: Response.req.query.Error, // Error

		Rooms: RoomData, // Rooms
		RoomsAreAvailable: RoomData.length !== 0 // Are rooms available?
	}));
});

// Get top 50 users.
App.Apps.Express.get('/Leaderboard', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	App.Databases.UserDatabase.serialize(function() {
		App.Databases.UserDatabase.all('SELECT rowid AS Place, * FROM Users LIMIT 50', function(Error, Users) { // Get top 50 users.
			if (Error) { // Error!
				App.Console.Throw(Error);
			}

			// Compile top 50 users.
			for (var Iterator = 0; Iterator < Users.length; Iterator++) {
				if (Users[Iterator].Username === '') { // If no username, remove user from leaderboard.
					Users.splice(Iterator, 1);
					Iterator--; // Go back because there will be a new position filled where the last one got deleted.
				} else {
					// Fix accuracy if wrong.
					var Accuracy = Users[Iterator].Kills * 100 / Users[Iterator].Shots;

					if (Accuracy.toString() === 'NaN') {
						Accuracy = 0;
					}

					Users[Iterator].Accuracy = Accuracy.toFixed(2);

					// Fix KDR if wrong.
					var Kdr = Users[Iterator].Kills / Users[Iterator].Deaths;

					if (Kdr === Infinity) {
						Kdr = Users[Iterator].Kills;
					} else if (Kdr.toString() === 'NaN') {
						Kdr = 0;
					}

					Users[Iterator].Kdr = Kdr.toFixed(2);
				}
			}

			// Send page with rows.
			Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Leaderboard.html'.LocalFilePath, {
				IsAuthenticated: !!Request.user, // Is authenticated?
				Me: Request.user, // Me
				Err: Response.req.query.Error, // Error

				ThereAreNotUsers: Users.length === 0, // Are there not users?
				Users: Users // User data.
			}));
		});
	});
});

// Search users.
App.Apps.Express.get('/SearchUsers', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If is maintaining, all processes must be stopped.
		Response.json('Maintenance');
		return;
	}

	if (!Response.req.query.Query) { // If no query, send nothing.
		res.send([]);
	} else {
		// Get all usernames like query.
		App.Databases.UserDatabase.serialize(function() {
			App.Databases.UserDatabase.all('SELECT rowid AS Place, * FROM Users WHERE Username LIKE "%' + Response.req.query.Query + '%" OR Username LIKE "%' + Response.req.query.Query + '" OR Username LIKE "' + Response.req.query.Query + '%" OR Username LIKE "' + Response.req.query.Query+ '" LIMIT 50', function(Error, Users) {
				if (Error) { // Error!
					App.Console.Throw(Error);
				}

				// Compile users.
				for (var Iterator = 0; Iterator < Users.length; Iterator++) {
					if (Users[Iterator].Username === '') { // Don't send users who have not signed up yet.
						Users.splice(Iterator, 1);
						Iterator--;
					} else { // Remove personal information.
						delete Users[Iterator].Email;
						delete Users[Iterator].Id;
					}
				}

				// Send users.
				Response.send(Users);
			});
		});
	}
});

// Get user profile.
App.Apps.Express.get('/Profile/:Username', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Get user data.
	App.Databases.UserDatabase.serialize(function() {
		App.Databases.UserDatabase.all('SELECT * FROM Users WHERE Username="' + Request.params.Username + '" LIMIT 1', function(Error, User) {
			if (Error) { // Error!
				App.Console.Throw(Error);
			}

			// Send page.
			Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Profile.html'.LocalFilePath, {
				IsAuthenticated: true, // Is authenticated?
				Me: Request.user, // Me
				Err: Response.req.query.Error, // Error

				IsViewingSelf: !!Request.user ? (Request.user.Username === User[0].Username) : false, // Is viewing self?
				DidNotFindUser: User.length === 0, // Did not find user?
				User: User[0] // User found.
			}));
		});
	});
});

//========== START /MYADMIN/* ROUTES ==========

// Main admin page.
App.Apps.Express.get('/MyAdmin', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Admin.html'.LocalFilePath, {}));
});

// Login authentication.
App.Apps.Express.post('/MyAdmin/Login', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If is maintaining, all processes must be stopped.
		Response.json('Maintenance');
		return;
	}

	if (Response.req.query.Username === 'admin' && Response.req.query.Password === '123') { // Match username and password.
		Response.json({Signal: true, SecretToken: App.Configs.Global.AdminSecret});
		return;
	}

	Response.json({Signal: false, Error: 'Invalid login.'});
});

// Run arguments.
App.Apps.Express.post('/MyAdmin/Do', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If is maintaining, all processes must be stopped.
		Response.json('Maintenance');
		return;
	}

	if (Response.req.query.Secret == App.Configs.Global.AdminSecret) {
		if (Response.req.query.Action === 'rows') {
			try {
				App.Databases.UserDatabase.serialize(function() {
					var StartTime = Date.now();

					App.Databases.UserDatabase.all(Response.req.query.Query, function(Error, Rows) {
						if (Error) {
							Response.json({Signal: false, Error: Error.message});
						} else {
							Response.json({Signal: true, Rows: Rows, Time: Date.now() - StartTime});
						}
					});
				});
			} catch (Error) {
				Response.json({Signal: false, Error: Error.message});
			}
		} else if (Response.req.query.Action === 'run') {
			App.Databases.UserDatabase.serialize(function() {
				var StartTime = Date.now();

				App.Databases.UserDatabase.run(Response.req.query.Query, function(Error) {
					if (Error) {
						Response.json({Signal: false, Error: Error.message});
					} else {
						Response.json({Signal: true, Time: Date.now() - StartTime});
					}
				});
			});
		} else {
			Response.json({Signal: false, Error: 'Invalid query.'});
		}
	} else {
		Response.json({Signal: false, Error: 'Unauthorized.'});
	}
});

//========== START GAME ROUTES ==========

// Send rooms.
App.Apps.Express.get('/Rooms', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Compile room data.
	var Rooms = [];
	if (Request.user) { // If user is logged in compile rooms.
		for (var RoomName in App.Vars.Rooms) { // Compile rooms.
			if (App.Vars.Rooms.hasOwnProperty(RoomName)) {
				Rooms.push({ Name: RoomName, PlayerNumber: App.Apps.SocketIO.sockets.clients(RoomName).length, IsProtected: !!App.Vars.Rooms[RoomName].Password });
			}
		}
	}
	Response.send(Rooms);
});

// Join a room.
App.Apps.Express.get('/Play/:RoomName', App.Apps.Express.MiddleWare.AuthenticateUser, App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (!Request.user.Username) { // No username, force setup.
		Response.redirect('/Me/Profile/Finalize');
	} else { // Send page.
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Game.html'.LocalFilePath, {
			Me: Request.user, //Me
			RoomData: { Name: Request.params.RoomName, Password: Response.req.query.Password, PlayerNumber: Response.req.query.PlayerNumber || 1}, // Game Data
			IsDebugging: App.Configs.Global.IsDebugging // Is debugging?
		}));
	}
});

//========== START SYSTEM ROUTES ==========

App.Apps.Express.get('/IP', function(req, res) {
	res.send(req.ip || req.ips);
});

// Maintenance page.
App.Apps.Express.get('/Maintenance', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If maintaining, send maintenance file.
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Assets/Html/Maintenance.html'.LocalFilePath, {
			IsAuthenticated: !!Request.user, // Is authenticated?
			Me: Request.user, // Me
			Err: Response.req.query.Error // Error
		}));
	} else { // Otherwise, redirect to home.
		Response.redirect('/');
	}
});

// 404.
App.Apps.Express.get('*', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Tell user we could not find the requested url.
	Response.send(App.Vars.ResponseCodes.NotFound, 'Cannot find "' + Request.url + '".');
	// Response.redirect('/?Error=Cannot find "' + Request.url + '".');
});

//========== START SOCKET.IO ==========

// Socket.IO paths.
App.Apps.SocketIO.sockets.on('connection', function(Socket) {
	Socket.IP = Socket.handshake.address.address + ':' + Socket.handshake.address.port; /**< Full IP address. */

	App.Console.Log(App.Vars.LineNumber, ('New Connection: ' + Socket.IP + '.').green);

	// Get PassPort session.
	Socket.handshake.getSession(function (Error, Session) {
		if (Error) { // Error!
			App.Console.Throw(Error);
		}

		// User is requesting to be added.
		Socket.on('user::create', function(RoomData) {
			App.Console.Log(App.Vars.LineNumber, ('New User: ' + Session.passport.user.Username + '.').green);

			// Create room if not exist.
			if (!App.Vars.Rooms[RoomData.Name]) {
				App.Vars.Rooms[RoomData.Name] = RoomData;
				App.Vars.Rooms[RoomData.Name].Creator = Session.passport.user.Username;
			}

			// Join the room.
			Socket.join(RoomData.Name);
			Session.passport.user.Room = RoomData.Name;
			Session.passport.user.IsPlaying = true;

			// Send message that user joined the room.
			App.Apps.SocketIO.sockets.in(RoomData.Name).emit('user::create', Session.passport.user.Username);

			// Create leaderboard.
			var Players = App.Apps.SocketIO.sockets.clients(RoomData.Name),
				Leaderboard = [];
			for (var Iterator = 0; Iterator < Players.length; Iterator++) {
				var Player = Players[Iterator].handshake.user;
				if (Player.Username !== Session.passport.user.Username) {
					Leaderboard.push({
						Username: Player.Username,
						Kills: Player.Kills,
						Deaths: Player.Deaths
					});
				}
			}

			// Send the leaderboard to the new user.
			App.Apps.SocketIO.sockets.socket(Socket.id).emit('leaderboard::get', Leaderboard);
		});

		Socket.on('user::authenticate', function(RoomName) {
			// Authenticate with password.
			Socket.emit('user::authenticate', !!App.Vars.Rooms[RoomName] ? (!!App.Vars.Rooms[RoomName].Password ? App.Vars.Rooms[RoomName].Password : '') : '');
		});

		// User is requesting to send a message.
		Socket.on('user::chat', function(Message) {
			// Send message to room.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('user::chat', Session.passport.user.Username, Message);
		});

		// Socket.on('pos::set', function(PlayerPosition) {
		// 	Socket.broadcast.to(Session.passport.user.Room).emit('pos::get', Session.passport.user.Username, PlayerPosition);
		// });

		// User is requesting a new ball.
		Socket.on('ball::set', function(BallData) {
			App.Console.Log(App.Vars.LineNumber, ('Ball::Set (' + Session.passport.user.Username + ').').yellow);

			// Send ball info to the room.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('ball::set', Session.passport.user.Username, BallData);

			// Increment shots.
			Session.passport.user.Shots++;
		});

		// User is requesting score change.
		Socket.on('score::add', function(KillerInfo) {
			App.Console.Log(App.Vars.LineNumber, ('Score::Add (' + KillerInfo + ', ' + Session.passport.user.Username + ').').yellow);

			// Send score add message.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('score::add', KillerInfo, Session.passport.user.Username);

			// Increment deaths.
			Session.passport.user.Deaths++;
		});

		// User is requesting point add.
		Socket.on('point::add', function() {
			App.Console.Log(App.Vars.LineNumber, ('Point::Add (' + Session.passport.user.Username + ').').yellow);

			// Increment kills.
			Session.passport.user.Kills++;
		});

		// Client disconnected, save and remove user.
		Socket.on('disconnect', function() {
			// If the user is not playing, then don't say that the user left.
			if (Session.passport.user.IsPlaying === false) {
				App.Console.Log(App.Vars.LineNumber, ('Address disconnected: ' + Socket.IP + '.').red);

				return;
			}

			// Tell others that user is leaving.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('user::delete', Session.passport.user.Username);

			// Leave the room.
			Socket.leave(Session.passport.user.Room);

			// If no one is left, destroy the room.
			if (App.Apps.SocketIO.sockets.clients(Session.passport.user.Room).length === 0) {
				delete App.Vars.Rooms[Session.passport.user.Room];
			}

			// Not playing anymore.
			Session.passport.user.IsPlaying = false;

			// Save the session.
			Socket.handshake.saveSession(Session, function (Error) {
				if (Error) { // Error!
					App.Console.Throw(Error);
				}
			});

			// Update database with new information.
			App.Databases.UserDatabase.serialize(function() {
				App.Databases.UserDatabase.run('UPDATE Users SET Kills=' + Session.passport.user.Kills + ', Shots=' + Session.passport.user.Shots + ', Deaths=' + Session.passport.user.Deaths + ' WHERE Id="' + Session.passport.user.Id + '"', function(Error) {
					if (Error) { // Error!
						App.Console.Throw(Error);
					}
				});
			});

			App.Console.Log(App.Vars.LineNumber, ('User ' + Session.passport.user.Username + ' left.').red);
			App.Console.Log(App.Vars.LineNumber, ('Address disconnected: ' + Socket.IP + '.').red);
		});
	});
});

//========== START CRON JOBS ==========

// Maintenance CRON job.
App.Jobs.Maintenance = new App.Modules.Cron('00 00 00 * * *', function() { // Every day, at midnight.
		var Timer = Object.seal({
			StartTime: new Date(), // Time this job started.
			EndTime: null
		});

		App.Configs.Global.IsMaintaining = true; // Start maintenance on static pages.
		App.Apps.SocketIO.sockets.emit('maintenance'); // Start maintenance on SocketIO server.

		App.Databases.UserDatabase.serialize(function() {
			App.Databases.UserDatabase.all('SELECT * FROM Users ORDER BY Kills DESC', function(Error, Users) { // Get all users.
				if (Error) { // Error!
					App.Console.Throw(Error);
				}

				// Delete all user entries.
				App.Databases.UserDatabase.run('DELETE FROM Users', function(Error) {
					if (Error) { // Error!
						App.Console.Throw(Error);
					}
				});

				// Rewrite new entries.
				for (var Iterator = 0; Iterator < Users.length; Iterator++) {
					App.Databases.UserDatabase.run('INSERT INTO Users (Email, Username, Kills, Deaths, Shots, Id) VALUES ("' + Users[Iterator].Email + '", "' + Users[Iterator].Username + '", "' + Users[Iterator].Kills + '", "' + Users[Iterator].Deaths + '", "' + Users[Iterator].Shots + '", "' + Users[Iterator].Id + '")', function(Error) {
						if (Error) { // Error!
							App.Console.Throw(Error);
						}
					});
				}

				App.Configs.Global.IsMaintaining = false; // Stop maintenance.

				Timer.EndTime = (new Date()).getTime(); // Set end time of job.

				// Send log.
				App.Emails.Google.Emailer.sendMail({
					from: 'Invisiball Maintenance Job <' + App.Emails.Google.Account.Email + '>',
					to: App.Emails.Google.Account.Email,
					subject: 'Daily Maintenance Job',
					html: '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css"><link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap-theme.min.css"><script src="//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js"></script><h1>Daily Maintenance Job Log</h1><b>At: ' + Timer.StartTime.toString() + '</b><br><br><br><table class="table table-hover"><tbody><tr><td><b>Duration</b></td><td>' + (Timer.EndTime - Timer.StartTime.getTime()).toString() + ' ms</td></tr><tr><td><b>Entries Parsed</b></td><td>' + Users.length.toString() + ' ENTRIES</td></tr><tr><td><b>Final Server State</b></td><td>STABLE ✔</td></tr></tbody></table>'
				}, function(Error, Response) {
					if (Error) { // Error!
						App.Console.Throw(Error);
					}

					App.Console.Log(App.Vars.LineNumber, 'Sent maintenance log successfully!'.green);
				});
			});
		});
	}, null, false, 'America/Los_Angeles'
);

App.Jobs.Maintenance.start();

//========== START PROCESS EVENTS ==========

process.on('exit', function() {
	App.Console.Log(App.Vars.LineNumber, 'Cleaning up...'.red);
	App.Databases.UserDatabase.close();
	process.exit();
});

process.on('SIGINT', function() {
	process.exit();
});
