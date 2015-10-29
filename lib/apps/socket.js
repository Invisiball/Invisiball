module.exports = function initSocketModule(db, httpServer, rooms, cookieParser) {
	var io = require('socket.io')(httpServer);
	var passportIo = require('passport.socketio');
	var ioSessions = require('socket-io.sessions');
	// var io = new (require('session.socket.io'))(rawIO, db.sessions, cookieParser);

	// Set up Socket.IO sessions and passport.
	io.use(ioSessions({
		cookieParser: cookieParser,
		key: 'express.sid',
		secret: 'yawk yawk yawk yawk',
		store: db.sessions
	})).use(passportIo.authorize({
		cookieParser: cookieParser,
		key: 'express.sid',
		secret: 'yawk yawk yawk yawk',
		store: db.sessions,
	}));

	// Socket.IO paths.
	io.on('connection', function(socket) {
		socket.ip = socket.request.connection.remoteAddress + ':' + socket.request.connection.remotePort; /**< Full IP address. */

		// Get session.
		socket.request.getSession(function(err, session) {
			if (err) {
				throw err;
			}

			// User is requesting to be added.
			socket.on('user::create', function(room) {
				// Create room if not exist.
				if (!rooms[room.name]) {
					rooms[room.name] = room;
					rooms[room.name].creator = session.passport.user.username;
					rooms[room.name].leaderboard = {};
				}

				// Add user to leaderboard.
				rooms[room.name].leaderboard[session.passport.user.username] = {
					kills: 0,
					deaths: 0
				};

				// Join the room.
				socket.join(room.name);
				session.passport.user.room = room.name;
				session.passport.user.isPlaying = true;

				// Send message that user joined the room.
				io.to(room.name).emit('user::create', session.passport.user.username);

				// Send the leaderboard to the new user.
				socket.emit('leaderboard::get', rooms[room.name].leaderboard);
			});

			socket.on('user::authenticate', function(roomName) {
				// Authenticate with password.
				socket.emit('user::authenticate', rooms[roomName] ? (rooms[roomName].password ? rooms[roomName].password : '') : '');
			});

			// User is requesting to send a message.
			socket.on('user::chat', function(message) {
				// Send message to room.
				io.to(session.passport.user.room).emit('user::chat', session.passport.user.username, message);
			});

			// socket.on('pos::set', function(PlayerPosition) {
			// 	socket.broadcast.to(session.passport.user.room).emit('pos::get', session.passport.user.username, PlayerPosition);
			// });

			// User is requesting a new ball.
			socket.on('ball::set', function(ball) {
				// Send ball info to the room.
				io.to(session.passport.user.room).emit('ball::set', session.passport.user.username, ball);

				// Increment shots.
				session.passport.user.shots++;
			});

			// User is requesting score change.
			socket.on('score::add', function(killer) {
				// Update leaderboard.
				rooms[session.passport.user.room].leaderboard[session.passport.user.username].deaths++;

				// Send score add message.
				io.to(session.passport.user.room).emit('score::add', killer, session.passport.user.username);

				// Increment deaths.
				session.passport.user.deaths++;
			});

			// User is requesting point add.
			socket.on('point::add', function() {
				// Update leaderboard.
				rooms[session.passport.user.room].leaderboard[session.passport.user.username].kills++;

				// Increment kills.
				session.passport.user.kills++;
			});

			// Client disconnected, save and remove user.
			socket.on('disconnect', function() {
				// If the user is not playing, then don't say that the user left.
				if (session.passport.user.isPlaying === false) {
					return;
				}

				// Tell others that user is leaving.
				io.to(session.passport.user.room).emit('user::delete', session.passport.user.username);

				// Leave the room.
				socket.leave(session.passport.user.room);

				// If no one is left, destroy the room.
				if (io.clients(session.passport.user.room).length === 0) {
					delete rooms[session.passport.user.room];
				}

				// Not playing anymore.
				session.passport.user.isPlaying = false;

				// Save the session.
				socket.request.saveSession(session, function(err) {
					if (err) {
						throw err;
					}
				});

				// Update database with new information.
				db.users.update({ cid: session.passport.user.cid }, { kills: session.passport.user.kills, shots: session.passport.user.shots, deaths: session.passport.user.deaths }, function(err) {
					if (err) {
						throw err;
					}
				});
			});
		});
	});

	io.clients = function clients(roomId, namespace) {
		var res = [], ns = this.of(namespace || '/');

		if (ns) {
			for (var id in ns.connected) {
				if (ns.connected.hasOwnProperty(id) && roomId) {
					var index = ns.connected[id].rooms.indexOf(roomId);
					if (index !== -1) {
						res.push(ns.connected[id]);
					}
				}
			}
		}

		return res;
	};

	return io;
};
