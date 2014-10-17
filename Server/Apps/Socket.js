// Socket.IO paths.
App.Apps.SocketIO.sockets.on('connection', function(Socket) {
	Socket.IP = Socket.handshake.address.address + ':' + Socket.handshake.address.port; /**< Full IP address. */

	App.Console.Log(__filename, App.Utils.LineNumber, ('New Connection: ' + Socket.IP + '.').green);

	// Get PassPort session.
	Socket.handshake.getSession(function (Error, Session) {
		if (Error) { // Error!
			App.Console.Throw(__filename, App.Utils.LineNumber, Error);
		}

		// User is requesting to be added.
		Socket.on('user::create', function(RoomData) {
			App.Console.Log(__filename, App.Utils.LineNumber, ('New User: ' + Session.passport.user.Username + '.').green);

			// Create room if not exist.
			if (!App.Vars.Rooms[RoomData.Name]) {
				App.Vars.Rooms[RoomData.Name] = RoomData;
				App.Vars.Rooms[RoomData.Name].Creator = Session.passport.user.Username;
				App.Vars.Rooms[RoomData.Name].Leaderboard = {};
			}

			// Add user to leaderboard.
			App.Vars.Rooms[RoomData.Name].Leaderboard[Session.passport.user.Username] = {
				Kills: 0,
				Deaths: 0
			};

			// Join the room.
			Socket.join(RoomData.Name);
			Session.passport.user.Room = RoomData.Name;
			Session.passport.user.IsPlaying = true;

			// Send message that user joined the room.
			App.Apps.SocketIO.sockets.in(RoomData.Name).emit('user::create', Session.passport.user.Username);

			// Send the leaderboard to the new user.
			App.Apps.SocketIO.sockets.socket(Socket.id).emit('leaderboard::get', App.Vars.Rooms[RoomData.Name].Leaderboard);
		});

		Socket.on('user::authenticate', function(RoomName) {
			// Authenticate with password.
			Socket.emit('user::authenticate', App.Vars.Rooms[RoomName] ? (App.Vars.Rooms[RoomName].Password ? App.Vars.Rooms[RoomName].Password : '') : '');
		});

		// User is requesting to send a message.
		Socket.on('user::chat', function(Message) {
			// Send message to room.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('user::chat', Session.passport.user.Username, Message);
		});

		// Socket.on('pos::set', function(PlayerPosition) {
		// 	Socket.broadcast.to(Session.passport.user.Room).emit('pos::get', Session.passport.user.Username, PlayerPosition);
		// });

		// User is requesting a new ball.
		Socket.on('ball::set', function(BallData) {
			App.Console.Log(__filename, App.Utils.LineNumber, ('Ball::Set (' + Session.passport.user.Username + ').').yellow);

			// Send ball info to the room.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('ball::set', Session.passport.user.Username, BallData);

			// Increment shots.
			Session.passport.user.Shots++;
		});

		// User is requesting score change.
		Socket.on('score::add', function(KillerInfo) {
			App.Console.Log(__filename, App.Utils.LineNumber, ('Score::Add (' + KillerInfo + ', ' + Session.passport.user.Username + ').').yellow);

			// Update leaderboard.
			App.Vars.Rooms[Session.passport.user.Room].Leaderboard[Session.passport.user.Username].Deaths++;

			// Send score add message.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('score::add', KillerInfo, Session.passport.user.Username);

			// Increment deaths.
			Session.passport.user.Deaths++;
		});

		// User is requesting point add.
		Socket.on('point::add', function() {
			App.Console.Log(__filename, App.Utils.LineNumber, ('Point::Add (' + Session.passport.user.Username + ').').yellow);

			// Increment kills.
			Session.passport.user.Kills++;
		});

		// Client disconnected, save and remove user.
		Socket.on('disconnect', function() {
			// If the user is not playing, then don't say that the user left.
			if (Session.passport.user.IsPlaying === false) {
				App.Console.Log(__filename, App.Utils.LineNumber, ('Address disconnected: ' + Socket.IP + '.').red);

				return;
			}

			// Tell others that user is leaving.
			App.Apps.SocketIO.sockets.in(Session.passport.user.Room).emit('user::delete', Session.passport.user.Username);

			// Leave the room.
			Socket.leave(Session.passport.user.Room);

			// If no one is left, destroy the room.
			if (App.Apps.SocketIO.sockets.clients(Session.passport.user.Room).length === 0) {
				delete App.Vars.Rooms[Session.passport.user.Room];
			}

			// Not playing anymore.
			Session.passport.user.IsPlaying = false;

			// Save the session.
			Socket.handshake.saveSession(Session, function (Error) {
				if (Error) { // Error!
					App.Console.Throw(__filename, App.Utils.LineNumber, Error);
				}
			});

			// Update database with new information.
			App.Databases.UserDatabase.update({Id: Session.passport.user.Id}, { $set: { Kills: Session.passport.user.Kills, Shots: Session.passport.user.Shots, Deaths: Session.passport.user.Deaths } }, function(Error) {
				if (Error) {
					App.Console.Throw(__filename, App.Utils.LineNumber, Error);
				}
			});

			App.Console.Log(__filename, App.Utils.LineNumber, ('User ' + Session.passport.user.Username + ' left.').red);
			App.Console.Log(__filename, App.Utils.LineNumber, ('Address disconnected: ' + Socket.IP + '.').red);
		});
	});
});

module.exports = null;
