module.exports = function initIndexRouterModule(config, db, app, io, rooms, swig) {
	// Main page.
	app.get('/', function(req, res) {
		var rooms_ = [];

		if (req.user) { // If user is logged in, compile rooms.
			for (var room in rooms) {
				rooms_.push({ name: room, players: io.sockets.clients(room).length, locked: !!rooms[room].password });
			}
		}

		// Send page.
		res.send(swig.renderFile(config.assetPath + '/html/main.html', {
			isAuthenticated: !!req.user,
			me: req.user,
			error: res.req.query.error,

			rooms: rooms_,
			roomsAvailable: !!rooms_.length, // Are rooms available?

			googleAuth: !!config.auth.google,
			fbAuth: !!config.auth.fb,
			twitterAuth: !!config.auth.twitter,
			noAuth: !config.auth.google && !config.auth.twitter && !config.auth.fb
		}));
	});

	// Get top users.
	app.get('/leaderboard', function(req, res) {
		db.users.find({ username: { $exists: true, $ne: '' } }, { limit: 50, sort: [['kills', 'desc']] }).toArray(function(err, users) {
			if (err) {
				throw err;
			}

			// Compile top users.
			for (var user = 0; user < users.length; user++) {
				users[user].place = user + 1;

				// Fix accuracy if wrong.
				var accuracy = users[user].kills * 100 / users[user].shots;

				if (accuracy === Infinity) {
					accuracy = 100;
				} else if (Number.isNaN(accuracy)) {
					accuracy = 0;
				}

				users[user].accuracy = accuracy.toFixed(2);

				// Fix KDR if wrong.
				var kdr = users[user].kills / users[user].deaths;

				if (kdr === Infinity) {
					kdr = users[user].kills;
				} else if (Number.isNaN(kdr)) {
					kdr = 0;
				}

				users[user].kdr = kdr.toFixed(2);
			}

			res.send(swig.renderFile(config.assetPath + '/html/leaderboard.html', {
				isAuthenticated: !!req.user,
				me: req.user,
				error: res.req.query.error,

				usersExist: !users.length, // Are there not users?
				users: users
			}));
		});
	});

	// Search users.
	app.get('/search', function(req, res) {
		if (!res.req.query.query) { // If no query, send nothing.
			res.send([]);
		} else {
			// Get all usernames like query.
			/** @todo Fix this! */
			db.users.find({ username: res.req.query.query }, { sort: [['kills', 'desc']] }).toArray(function(err, users) {
				if (err) {
					throw err;
				}

				// Compile users.
				for (var user = 0; user < users.length; user++) {
					if (users[user].username === '') { // Don't send users who have not signed up yet.
						users.splice(user, 1);
						user--;
					} else { // Remove personal information.
						// Fix accuracy if wrong.
						var accuracy = users[user].kills * 100 / users[user].shots;

						if (accuracy.toString() === 'NaN') {
							accuracy = 0;
						}

						users[user].accuracy = accuracy.toFixed(2);

						// Fix KDR if wrong.
						var kdr = users[user].kills / users[user].deaths;

						if (kdr === Infinity) {
							kdr = users[user].kills;
						} else if (kdr.toString() === 'NaN') {
							kdr = 0;
						}

						users[user].kdr = kdr.toFixed(2);

						delete users[user].email;
						delete users[user].id;
						delete users[user].client;
					}
				}

				res.send(users);
			});
		}
	});

	// Get user profile.
	app.get('/profile/:username', function(req, res) {
		// Get user data.
		db.users.findOne({ username: req.params.username }, function(err, user) {
			if (err) {
				throw err;
			}

			// Send page.
			res.send(swig.renderFile(config.assetPath + '/html/profile.html', {
				isAuthenticated: true,
				me: req.user,
				error: res.req.query.error,

				isSelf: req.user ? (req.user.username === user.username) : false,
				noUser: !!user,
				user: user
			}));
		});
	});
};
