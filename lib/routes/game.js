module.exports = function initGameRouterModule(config, app, io, rooms, swig) {
	// Send rooms.
	app.get('/rooms', function(req, res) {
		// Compile room data.

		var _rooms = [];

		// If user is logged in compile rooms.
		if (req.user) {
			for (var roomName in rooms) {
				_rooms.push({ name: roomName, players: io.sockets.clients(roomName).length, locked: !!rooms[roomName].password });
			}
		}

		res.send(_rooms);
	});

	// Join a room.
	app.get('/play/:name', function(req, res) {
		if (!req.user.username) { // No username, force setup.
			res.redirect('/me/profile/finalize');
		} else {
			res.send(swig.renderFile(config.assetPath + '/html/game.html', {
				me: req.user,
				room: { name: req.params.name, password: res.req.query.password, maxPlayers: res.req.query.maxPlayers || 1 },
				isDebugging: config.isDebugging
			}));
		}
	});
};
