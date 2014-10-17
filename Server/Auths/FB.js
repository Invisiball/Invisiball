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
			App.Databases.UserDatabase.insert({ Email: Profile.Email, Kills: 0, Deaths: 0, Shots: 0, Id: Profile.Id, Client: App.Vars.ClientCodes.Facebook });

			Profile.Kills = 0;
			Profile.Deaths = 0;
			Profile.Shots = 0;
			Profile.Client = App.Vars.ClientCodes.Facebook;
		}

		return Done(null, Profile);
	});
}));

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

module.exports = null;
