// Send rooms.
App.Apps.Express.get('/Rooms', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Compile room data.
	var Rooms = [];
	if (Request.user) { // If user is logged in compile rooms.
		for (var RoomName in App.Vars.Rooms) { // Compile rooms.
			if (App.Vars.Rooms.hasOwnProperty(RoomName)) {
				Rooms.push({ Name: RoomName, PlayerNumber: App.Apps.SocketIO.sockets.clients(RoomName).length, IsProtected: !!App.Vars.Rooms[RoomName].Password });
			}
		}
	}
	Response.send(Rooms);
});

// Join a room.
App.Apps.Express.get('/Play/:RoomName', App.Apps.Express.MiddleWare.AuthenticateUser, App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	if (!Request.user.Username) { // No username, force setup.
		Response.redirect('/Me/Profile/Finalize');
	} else { // Send page.
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile(App.Configs.AssetPath + '/Html/Game.html', {
			Me: Request.user, //Me
			RoomData: { Name: Request.params.RoomName, Password: Response.req.query.Password, PlayerNumber: Response.req.query.PlayerNumber || 1}, // Game Data
			IsDebugging: App.Configs.Global.IsDebugging // Is debugging?
		}));
	}
});

module.exports = null;
