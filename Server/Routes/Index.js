// Main page.
App.Apps.Express.get('/', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	var RoomData = [];
	if (Request.user) { // If user is logged in, compile rooms.
		for (var RoomName in App.Vars.Rooms) {
			if (App.Vars.Rooms.hasOwnProperty(RoomName)) {
				var PlayerNumber = App.Apps.SocketIO.sockets.clients(RoomName).length;

				if (PlayerNumber < App.Vars.Rooms[RoomName].PlayerNumber) {
					RoomData.push({ Name: RoomName, PlayerNumber: PlayerNumber, IsProtected: !!App.Vars.Rooms[RoomName].Password, Creator: App.Vars.Rooms[RoomName].Creator });
				}
			}
		}
	}

	// Send page.
	Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Main.html'.AssetPath, {
		IsAuthenticated: !!Request.user, // Is authenticated?
		Me: Request.user, // Me
		Err: Response.req.query.Error, // Error

		Rooms: RoomData, // Rooms
		RoomsAreAvailable: RoomData.length !== 0 // Are rooms available?
	}));
});

// Get top users.
App.Apps.Express.get('/Leaderboard', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	App.Databases.UserDatabase.find({ Username: { $exists: true, $ne: '' } }, { limit: 50, sort: [['Kills', 'desc']] }).toArray(function(Error, Users) {
		if (Error) {
			App.Console.Throw(__filename, App.Utils.LineNumber, Error);
		}

		// Compile top users.
		for (var Iterator = 0; Iterator < Users.length; Iterator++) {
			Users[Iterator].Place = Iterator + 1;

			// Fix accuracy if wrong.
			var Accuracy = Users[Iterator].Kills * 100 / Users[Iterator].Shots;

			if (Accuracy === Infinity) {
				Accuracy = 100;
			} else if (Number.isNaN(Accuracy)) {
				Accuracy = 0;
			}

			Users[Iterator].Accuracy = Accuracy.toFixed(2);

			// Fix KDR if wrong.
			var Kdr = Users[Iterator].Kills / Users[Iterator].Deaths;

			if (Kdr === Infinity) {
				Kdr = Users[Iterator].Kills;
			} else if (Number.isNaN(Kdr)) {
				Kdr = 0;
			}

			Users[Iterator].Kdr = Kdr.toFixed(2);
		}

		// Send page with rows.
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Leaderboard.html'.AssetPath, {
			IsAuthenticated: !!Request.user, // Is authenticated?
			Me: Request.user, // Me
			Err: Response.req.query.Error, // Error

			ThereAreNotUsers: Users.length === 0, // Are there not users?
			Users: Users // User data.
		}));
	});
});

// Search users.
App.Apps.Express.get('/SearchUsers', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If is maintaining, all processes must be stopped.
		Response.json('Maintenance');
		return;
	}

	if (!Response.req.query.Query) { // If no query, send nothing.
		Response.send([]);
	} else {
		// Get all usernames like query.
		/** @todo Fix this! */
		App.Databases.UserDatabase.find({ Username: Response.req.query.Query }, { sort: [['Kills', 'desc']] }).toArray(function(Error, Users) {
			if (Error) { // Error!
				App.Console.Throw(__filename, App.Utils.LineNumber, Error);
			}

			// Compile users.
			for (var Iterator = 0; Iterator < Users.length; Iterator++) {
				if (Users[Iterator].Username === '') { // Don't send users who have not signed up yet.
					Users.splice(Iterator, 1);
					Iterator--;
				} else { // Remove personal information.
					// Fix accuracy if wrong.
					var Accuracy = Users[Iterator].Kills * 100 / Users[Iterator].Shots;

					if (Accuracy.toString() === 'NaN') {
						Accuracy = 0;
					}

					Users[Iterator].Accuracy = Accuracy.toFixed(2);

					// Fix KDR if wrong.
					var Kdr = Users[Iterator].Kills / Users[Iterator].Deaths;

					if (Kdr === Infinity) {
						Kdr = Users[Iterator].Kills;
					} else if (Kdr.toString() === 'NaN') {
						Kdr = 0;
					}

					Users[Iterator].Kdr = Kdr.toFixed(2);

					delete Users[Iterator].Email;
					delete Users[Iterator].Id;
					delete Users[Iterator]._id;
					delete Users[Iterator].Client;
				}
			}

			// Send users.
			Response.send(Users);
		});
	}
});

// Get user profile.
App.Apps.Express.get('/Profile/:Username', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Get user data.
	App.Databases.UserDatabase.findOne({ Username: Request.params.Username }, function(Error, Found) {
		if (Error) { // Error!
			App.Console.Throw(__filename, App.Utils.LineNumber, Error);
		}

		// Send page.
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Profile.html'.AssetPath, {
			IsAuthenticated: true, // Is authenticated?
			Me: Request.user, // Me
			Username: Request.params.Username, // Username requested
			Err: Response.req.query.Error, // Error

			IsViewingSelf: Request.user ? (Request.user.Username === (Found || {}).Username) : false, // Is viewing self?
			DidNotFindUser: !Found, // Did not find user?
			User: Found // User found.
		}));
	});
});

module.exports = null;
