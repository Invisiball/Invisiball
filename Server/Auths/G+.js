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
	App.Databases.UserDatabase.find({ Id: Profile.Id }).toArray(function(Error, FoundInfo) {
		if (Error) {
			App.Console.Throw(__filename, App.Utils.LineNumber, Error);
		}

		FoundInfo = FoundInfo[0];

		if (FoundInfo) {
			Profile.Username = FoundInfo.Username;
			Profile.Kills = FoundInfo.Kills;
			Profile.Deaths = FoundInfo.Deaths;
			Profile.Shots = FoundInfo.Shots;
			Profile.Client = FoundInfo.Client;
		} else {
			App.Databases.UserDatabase.insert({ Email: Profile.Email, Kills: 0, Deaths: 0, Shots: 0, Id: Profile.Id, Client: App.Vars.ClientCodes.Google }, function(Error) {
				if (Error) {
					App.Console.Throw(__filename, App.Utils.LineNumber, Error);
				}
			});

			Profile.Kills = 0;
			Profile.Deaths = 0;
			Profile.Shots = 0;
			Profile.Client = App.Vars.ClientCodes.Google;
		}

		return Done(null, Profile);
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

module.exports = null;
