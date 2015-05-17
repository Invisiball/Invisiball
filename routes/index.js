module.exports = function(utils, db, passport) {
	var index = require('express').Router();

	var auth = function(req, res, next) {
		if (req.user) {
			return next();
		}

		res.redirect('/?error=' + escape('Unauthorized.'));
	};

	index.route('/').get(function(req, res, next) {
		if (req.user) {
			return db.rooms.find({}).populate('creator').exec(function(error, rooms) {
				if (error) {
					return next(error);
				}

				res.render('index', { user: req.user, rooms: rooms, error: req.query.error });
			});
		}

		res.render('index', { user: req.user, error: req.query.error });
	});

	index.route('/login').get(function(req, res, next) {
		if (req.user) {
			return res.redirect('/');
		}

		res.render('authenticate', { user: req.user, action: 'login', error: req.query.error });
	}).post(function(req, res, next) {
		if (req.user) {
			return res.redirect('/?error=' + escape('Already logged in.'));
		}

		if (!req.body.username) {
			return res.redirect('/login?error=' + escape('Missing username.'));
		}

		if (!req.body.password) {
			return res.redirect('/login?error=' + escape('Missing password.'));
		}

		passport.authenticate('local', function(error, user, info, status) {
			if (error) {
				return next(error);
			}

			if (user) {
				return req.login(user, function(error) {
					if (error) {
						return next(error);
					}

					res.redirect('/?error=' + escape('Success!'));
				});
			}

			res.redirect('/login?error=' + escape('Incorrect username and password combination.'));
		})(req, res, next);
	});

	index.route('/signup').get(function(req, res, next) {
		if (req.user) {
			return res.redirect('/');
		}

		res.render('authenticate', { user: req.user, action: 'signup', error: req.query.error });
	}).post(function(req, res, next) {
		if (req.user) {
			return res.redirect('/?error=' + escape('Already logged in.'));
		}

		if (!req.body.username) {
			return res.redirect('/signup?error=' + escape('Missing username.'));
		}

		if (!req.body.password) {
			return res.redirect('/signup?error=' + escape('Missing password.'));
		}

		db.players.findOne({ username: req.body.username }, function(error, user) {
			if (error) {
				return next(error);
			}

			if (user) {
				return res.redirect('/signup?error=' + escape('User already exists.'));
			}

			var user = new db.players({
				username: req.body.username,
				password: utils.whirlpool(req.body.password),
				kills: 0,
				deaths: 0
			});
			user.save(function(error, user) {
				if (error) {
					return res.redirect('/signup?error=' + escape('Could not save user.'));
				}

				res.redirect('/login?error=' + escape('Success!'));
			});
		});
	});

	index.route('/logout').get(auth, function(req, res, next) {
		req.logout();
		res.redirect('/');
	});

	index.route('/profile/:username').get(auth, function(req, res, next) {
		db.players.findOne({ username: req.params.username }, function(error, player) {
			if (error) {
				return next(error);
			}

			if (!player) {
				return next(new Error('Could not find player.'));
			}

			res.render('profile', { user: req.user, username: req.params.username, player: player });
		});
	});

	index.route('/leaderboard').get(auth, function(req, res, next) {
		db.players.find({}).sort({ kills: -1, deaths: 1 }).limit(50).exec(function(error, leaders) {
			if (error) {
				return next(error);
			}

			res.render('leaderboard', { user: req.user, leaders: leaders });
		});
	});

	index.route('/room/new').post(auth, function(req, res, next) {
		if (!req.body.name) {
			return res.redirect('/?error=' + escape('Room name is missing.'));
		}

		if (req.body.name.length > 20) {
			return res.redirect('/?error=' + escape('Room name is too long (>20).'));
		}

		if (req.body.password && req.body.password.length > 20) {
			return res.redirect('/?error=' + escape('Password is too long (>20).'))
		}

		var modeType = +req.body.mode;
		if (Number.isNaN(modeType) || modeType < 0 || modeType > 2) {
			return res.redirect('/?error=' + escape('Mode type is erroneous.'));
		}

		var mapType = +req.body.map;
		if (Number.isNaN(mapType) || mapType < 0 || mapType > 3) {
			return res.redirect('/?error=' + escape('Map type is erroneous.'));
		}

		db.rooms.findOne({ name: req.body.name }, function(error, room) {
			if (error) {
				return next(error);
			}

			if (room) {
				return res.redirect('/?error=' + escape('Room already exists.'));
			}

			var newRoom = new db.rooms({
				name: req.body.name,
				password: req.body.password || null,
				creator: req.user._id,
				mode: modeType,
				map: mapType,
				leaderboard: [{ user: req.user._id, kills: 0, deaths: 0, team: 0 }]
			});
			newRoom.save(function(error, newRoom) {
				if (error) {
					return next(error);
				}

				res.render('game', { user: req.user, room: newRoom });
				res.redirect('/room/' + newRoom.id);
			});
		});
	});

	index.route('/room/:id([a-f\\d]{24})').get(auth, function(req, res, next) {
		db.rooms.findOne({ _id: req.params.id }).populate('leaderboard').exec(function(error, room) {
			if (error) {
				return next(error);
			}

			if (!room) {
				return res.redirect('/?error=' + escape('Could not find room.'));
			}

			res.render('game', { user: req.user, room: room });
		});
	});

	// index.use(function(req, res, next) {
	// 	res.redirect('/?error=' + escape('That page doesn\'t exist.'));
	// });

	return index;
};
