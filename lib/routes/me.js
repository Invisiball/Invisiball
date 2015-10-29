module.exports = function initMeRouterModule(config, db, app, rooms, swig) {
	// Main page.
	app.get('/me', app.middleware.authUser, function(req, res) {
		// Redirect to profile.
		res.redirect('/me/profile');
	});

	// User wants to login.
	app.get('/me/login', function(req, res) {
		if (req.user) { // If user, redirect them to their profile.
			res.redirect('/me/profile');
		} else {
			// Send login page.
			res.send(swig.renderFile(config.assetPath + '/html/main.html', {
				isAuthenticated: false,
				me: req.user,
				error: res.req.query.error,

				googleAuth: !!config.auth.google,
				fbAuth: !!config.auth.fb,
				twitterAuth: !!config.auth.twitter,
				noAuth: !config.auth.google && !config.auth.twitter && !config.auth.fb
			}));
		}
	});

	// Send profile's JSON object.
	app.get('/me/raw', app.middleware.authUser, function(req, res) {
		// Send info.
		res.send(req.user);
	});

	// Pretty version of /me/JSON.
	app.get('/me/profile', app.middleware.authUser, function(req, res) {
		// Send info.
		res.send(swig.renderFile(config.assetPath + '/html/profile.html', { // Send file.
			isAuthenticated: true,
			me: req.user,
			error: res.req.query.error,

			noUser: false,
			isSelf: true,
			user: req.user
		}));
	});

	// Finalize profile.
	app.get('/me/profile/finalize', app.middleware.authUser, function(req, res) {
		if (req.user.username) { // User already has a username.
			res.redirect('/?error=You have already finalized your username, "' + req.user.username + '".');
		} else {
			if (res.req.query.username) { // Is requesting username change.
				if (res.req.query.username.length < 8 || res.req.query.username.length > 20) { // Check for bad usernames.
					// Send page.
					res.send(swig.renderFile(config.assetPath + '/html/finalize.html', {
						isAuthenticated: true,
						me: req.user,
						error: 'Username "' + res.req.query.username + '" has to be between 8-20 characters.'
					}));
				} else {
					// Check if username is taken.
					db.users.findOne({ username: res.req.query.username }, function(err, found) {
						if (err) {
							throw err;
						}

						if (found) { // Is taken.
							res.send(swig.renderFile(config.assetPath + '/html/finalize.html', {
								isAuthenticated: true,
								me: req.user,
								error: 'Username "' + res.req.query.username + '" has been taken.'
							}));
						} else { // Is not, save username.
							req._passport.session.user.username = res.req.query.username;

							db.users.update({ cid: req.user.cid }, { username: res.req.query.username }, function(err) {
								if (err) {
									throw err;
								}
							});

							res.redirect('/me/profile/?error=Success!');
						}
					});
				}
			} else { // Requesting page, send page.
				res.send(swig.renderFile(config.assetPath + '/html/finalize.html', {
					isAuthenticated: true,
					me: req.user,
					error: res.req.query.error
				}));
			}
		}
	});

	// User wants to logout.
	app.get('/me/logout', function(req, res) {
		if (req.user) { // User logged in, so log out.
			req.logout();
			res.redirect('/me/login/?error=You have been successfully logged out!');
		} else { // No user to log out.
			res.redirect('/me/login/?error=Login First');
		}
	});
};
