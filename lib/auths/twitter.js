module.exports = function initTwitterAuthModule(config, db, app, passport) {
	if (!config.auth.twitter) {
		return null;
	}

	var twitterStrategy = require('passport-twitter').Strategy;

	passport.use(new twitterStrategy(
		config.auth.twitter,
		function(token, tokenSecret, profile, done) {
			// Get other profile info.
			db.users.findOne({ id: profile.id }, function(err, found) {
				if (err) {
					throw err;
				}

				if (found) {
					profile.username = found.username;
					profile.email = found.email || '';
					profile.kills = found.kills;
					profile.deaths = found.deaths;
					profile.shots = found.shots;
					profile.client = found.client;

					return done(null, profile);
				} else {
					// Create new user.

					// Check if Twitter username is taken.
					db.users.findOne({ username: profile.username }, function(err, _found) {
						if (err) {
							throw err;
						}

						profile.email = ''; // Twitter does not keep emails.
						profile.kills = 0;
						profile.deaths = 0;
						profile.shots = 0;
						profile.client = config.clientCodes.twitter;

						if (!_found) { // If is not taken, set username.
							profile.username = profile.username;

							db.users.insert({ id: profile.id, email: '', username: profile.username, client: config.clientCodes.twitter, kills: profile.kills, deaths: profile.deaths, shots: profile.shots }, function(err) {
								if (err) {
									throw err;
								}
							});
						} else { // Otherwise the user will have to pick another later.
							db.users.insert({ id: profile.id, email: '', username: profile.username, client: config.clientCodes.twitter, kills: profile.kills, deaths: profile.deaths, shots: profile.shots }, function(err) {
								if (err) {
									throw err;
								}
							});
						}

						return done(null, profile);
					});
				}
			});
		}
	));

	//========== START TWITTER AUTH ROUTER ==========

	// Authenticate user on this path.
	app.get('/auths/twitter', passport.authenticate('twitter'));

	// Redirect user according to return value.
	app.get('/auths/twitter/return', passport.authenticate('twitter', { failureRedirect: '/me/login/?error=Authentication Failed' }), function(req, res) {
		res.redirect('/auths/twitter/success');
	});

	// Authentication successful.
	app.get('/auths/twitter/success', function(req, res) {
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
