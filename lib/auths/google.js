module.exports = function initGoogleAuthModule(config, db, app, passport) {
	if (!config.auth.google) {
		return null;
	}

	var googleStrategy = require('passport-google-oauth').OAuth2Strategy;

	passport.use(new googleStrategy(
		config.auth.google,
		function(accessToken, refreshToken, profile, done) {
			// Get the primary email.
			profile.email = profile.emails[0].value;

			// Get other profile info.
			db.users.findOne({ id: profile.id }, function(err, user) {
				if (err) {
					throw err;
				}

				if (user) {
					profile.username = user.username;
					profile.kills = user.kills;
					profile.deaths = user.deaths;
					profile.shots = user.shots;
					profile.client = user.client;

					return done(null, profile);
				} else {
					// Create new user.

					profile.kills = 0;
					profile.deaths = 0;
					profile.shots = 0;
					profile.client = config.clientCodes.google;

					db.users.insert({
						id: profile.id,
						email: profile.email,
						client: profile.client,
						kills: profile.kills,
						deaths: profile.deaths,
						shots: profile.shots
					}, function(err) {
						if (err) {
							throw err;
						}

						return done(null, profile);
					});
				}
			});
		}
	));

	//========== START GOOGLE AUTH ROUTES ==========

	// Authenticate user on this path.
	app.get('/auths/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'] }));

	// Redirect user according to return value.
	app.get('/auths/google/return', passport.authenticate('google', { failureRedirect: '/?error=Authentication Failed' }), function(req, res) {
		res.redirect('/auths/google/success');
	});

	// Authentication successful.
	app.get('/auths/google/success', function(req, res) {
		if (req.user) {
			if (!req.user.username) { // If they didn't set up their profile, set it up.
				res.redirect('/me/profile/finalize');
			} else {
				res.redirect('/?error=Welcome back ' + req.user.username + '!');
			}
		} else {
			res.redirect('/?error=Login First');
		}
	});

	return null;
};
