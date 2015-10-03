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
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Main.html'.AssetPath, {
			IsAuthenticated: false, // Is authenticated?
			Me: Request.user, // Me
			Err: Response.req.query.Error, // Error

			GoogleAuthAvailable: App.Auths.Google.ClientInfo.Id && App.Auths.Google.ClientInfo.Secret,
			FacebookAuthAvailable: App.Auths.Facebook.ClientInfo.Id && App.Auths.Facebook.ClientInfo.Secret,
			TwitterAuthAvailable: App.Auths.Twitter.ClientInfo.Key && App.Auths.Twitter.ClientInfo.Secret,
			NoAuthAvailable: !(App.Auths.Google.ClientInfo.Id && App.Auths.Google.ClientInfo.Secret) &&
							 !(App.Auths.Facebook.ClientInfo.Id && App.Auths.Facebook.ClientInfo.Secret) &&
							 !(App.Auths.Twitter.ClientInfo.Key && App.Auths.Twitter.ClientInfo.Secret)
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
	Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Profile.html'.AssetPath, { // Send file.
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
			if (Response.req.query.NewUsername.length < 8 || Response.req.query.NewUsername.length > 20) { // Check for bad usernames.
				Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Finalize.html'.AssetPath, { // Send page.
					IsAuthenticated: true, // Is authenticated?
					Me: Request.user, // Me
					Err: 'Username "' + Response.req.query.NewUsername + '" has to be between 8-20 characters.' // Error
				}));
			} else {
				// Check if username is taken.
				App.Databases.UserDatabase.findOne({ Username: Response.req.query.NewUsername }, function(Error, Found) {
					if (Error) {
						App.Console.Throw(__filename, App.Utils.LineNumber, Error);
					}

					if (Found) { // Is taken.
						Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Finalize.html'.AssetPath, {
							IsAuthenticated: true, // Is authenticated?
							Me: Request.user, // Me
							Err: 'Username "' + Response.req.query.NewUsername + '" has been taken.' // Error
						}));
					} else { // Is not, save username.
						Request._passport.session.user.Username = Response.req.query.NewUsername;

						App.Databases.UserDatabase.update({ Id: Request.user.Id }, { $set: { Username: Response.req.query.NewUsername } }, function(Error) {
							if (Error) {
								App.Console.Throw(__filename, App.Utils.LineNumber, Error);
							}
						});

						Response.redirect('/Me/Profile/?Error=Success!');
					}
				});
			}
		} else { // Requesting page, send page.
			Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Finalize.html'.AssetPath, {
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

module.exports = null;
