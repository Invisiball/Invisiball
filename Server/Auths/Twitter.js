App.Auths.Twitter.Strategy = require('passport-twitter').Strategy; /**< Twitter Auth. */

App.Modules.PassPort.use(new App.Auths.Twitter.Strategy({
	consumerKey: App.Auths.Twitter.ClientInfo.Key,
	consumerSecret: App.Auths.Twitter.ClientInfo.Secret,
	callbackURL: App.Auths.Twitter.ClientInfo.Redirect
}, function(Token, TokenSecret, Profile, Done) {
	// Get the unique identifier.
	Profile.Identifier = Profile.Id = Profile.id;

	// Get other profile info.
	App.Databases.UserDatabase.findOne({ Id: Profile.Id }, function(Error, Found) {
		if (Error) {
			App.Console.Throw(__filename, App.Utils.LineNumber, Error);
		}

		if (Found) {
			Profile.Username = Found.Username;
			Profile.Email = Found.Email || '';
			Profile.Kills = Found.Kills;
			Profile.Deaths = Found.Deaths;
			Profile.Shots = Found.Shots;
			Profile.Client = Found.Client;
			Profile.Place = Found.Place;

			return Done(null, Profile);
		} else {
			// Check if Twitter username is taken.
			App.Databases.UserDatabase.findOne({ Username: Profile.username }, function(Error, _Found) {
				if (Error) {
					App.Console.Throw(__filename, App.Utils.LineNumber, Error);
				}

				App.Databases.UserDatabase.find({}).count(function(Error, Count) {
					if (Error) {
						App.Console.Throw(__filename, App.Utils.LineNumber, Error);
					}

					if (!_Found) { // If is not taken, set username.
						Profile.Username = Profile.username;

						App.Databases.UserDatabase.insert({ Email: '', Username: Profile.Username, Kills: 0, Deaths: 0, Shots: 0, Place: Count + 1, Id: Profile.Id, Client: App.Vars.ClientCodes.Twitter }, function(Error) {
							if (Error) {
								App.Console.Throw(__filename, App.Utils.LineNumber, Error);
							}
						});
					} else { // Otherwise the user will have to pick another later.
						App.Databases.UserDatabase.insert({ Email: '', Kills: 0, Deaths: 0, Shots: 0, Place: Count + 1, Id: Profile.Id, Client: App.Vars.ClientCodes.Twitter }, function(Error) {
							if (Error) {
								App.Console.Throw(__filename, App.Utils.LineNumber, Error);
							}
						});
					}

					// Default.
					Profile.Email = ''; // Twitter does not keep emails.
					Profile.Kills = 0;
					Profile.Deaths = 0;
					Profile.Shots = 0;
					Profile.Client = App.Vars.ClientCodes.Twitter;
					Profile.Place = Count + 1;

					return Done(null, Profile);
				});
			});
		}
	});
}));

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

module.exports = null;
