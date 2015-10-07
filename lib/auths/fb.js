module.exports = function initFbAuthModule(config, db, app, passport) {
	if (!config.auth.fb) {
		return null;
	}

	var fbStrategy = require('passport-facebook').Strategy;

	passport.use(new fbStrategy(
		config.auth.fb,
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
					// Create new user

					profile.kills = 0;
					profile.deaths = 0;
					profile.shots = 0;
					profile.client = config.clientCodes.fb;

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

	//========== START FACEBOOK AUTH ROUTES ==========

	// Authenticate user on this path.
	app.get('/auths/fb', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

	// Redirect user according to return value.
	app.get('/auths/fb/return', passport.authenticate('facebook', { failureRedirect: '/me/login/?error=Authentication Failed' }), function(req, res) {
		res.redirect('/auths/fb/success');
	});

	// Authentication successful.
	app.get('/auths/fb/success', function(req, res) {
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
