module.exports = function(config, utils, db, http, sessionStore, cookieParser) {
	var io = require('socket.io')(http);

	var lobby = io.of('/lobby');
	lobby.on('connection', function(socket) {
		cookieParser(config.secret)(socket.handshake, {}, function(error) {
			if (error) {
				throw error;
			}

			sessionStore.get((socket.handshake.signedCookies || socket.handshake.cookies)['connect.sid'], function(error, session) {
				if (error) {
					throw error;
				}

				if (!session) {
					throw new Error('Could not find session.');
				}

				db.players.findOne({ username: session.passport.user.username, password: session.passport.user.password }, function(error, player) {
					if (error) {
						throw error;
					}

					if (!player) {
						throw new Error('Could not find player.');
					}

					socket.player = player;

					socket.emit('names', lobby.sockets.map(function(conn) { return conn.player.username; }));
					socket.broadcast.emit('join', socket.player.username);

					socket.on('message', function(username, message) {
						if (username === '*') {
							lobby.emit('message', '*', socket.player.username, message);
						} else {
							var user = lobby.sockets.filter(function(conn) { return conn.player.username === user; })[0];
							user && lobby.to(user.id).emit('message', socket.player.username, socket.player.username, message);
						}
					});
				});
			});
		});
	});

	var game = io.of('/game');
	game.on('connection', function(socket) {
		cookieParser(config.secret)(socket.handshake, {}, function(error) {
			if (error) {
				throw error;
			}

			sessionStore.get((socket.handshake.signedCookies || socket.handshake.cookies)['connect.sid'], function(error, session) {
				if (error) {
					throw error;
				}

				if (!session) {
					throw new Error('Could not find session.');
				}

				db.players.findOne({ username: session.passport.user.username, password: session.passport.user.password }).populate('room').exec(function(error, player) {
					if (error) {
						throw error;
					}

					if (!player) {
						throw new Error('Could not find player.');
					}

					socket.player = utils.extend(player, { room: player.room._id.toString() });
					socket.join(player.room.name);
					socket.emit('joined');
				});
			});
		});
	});

	return {
		io: io,
		io_lobby: lobby,
		io_game: game
	};
};
