// Main admin page.
App.Apps.Express.get('/MyAdmin', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile('/Html/Admin.html'.AssetPath, {}));
});

// Login authentication.
App.Apps.Express.post('/MyAdmin/Login', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If is maintaining, all processes must be stopped.
		Response.json('Maintenance');
		return;
	}

	if (Response.req.query.Username === '' && Response.req.query.Password === '') { // Match username and password.
		Response.json({Signal: true, SecretToken: App.Configs.Global.AdminSecret});
		return;
	}

	Response.json({Signal: false, Error: 'Invalid login.'});
});

// Run arguments.
App.Apps.Express.post('/MyAdmin/Do', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If is maintaining, all processes must be stopped.
		Response.json('Maintenance');
		return;
	}

	if (Response.req.query.Secret == App.Configs.Global.AdminSecret) {
		try {
			var StartTime = Date.now();

			if (Response.req.query.Action === 'find') {
				App.Databases.UserDatabase.find(JSON.parse(Response.req.query.Query), JSON.parse(Response.req.query.Query2 || '{}')).toArray(function(Error, Rows) {
					if (Error) {
						Response.json({Signal: false, Error: Error.message});
					} else {
						Response.json({Signal: true, Rows: Rows, Time: Date.now() - StartTime});
					}
				});
			} else if (Response.req.query.Action === 'insert') {
				var data = JSON.parse(Response.req.query.Query);
				App.Databases.UserDatabase.insert(data, function(Error) {
					if (Error) {
						Response.json({Signal: false, Error: Error.message});
					} else {
						Response.json({Signal: true, Rows: (data.length || 1), Time: Date.now() - StartTime});
					}
				});
			} else if (Response.req.query.Action === 'update') {
				App.Databases.UserDatabase.insert(JSON.parse(Response.req.query.Query), JSON.parse(Response.req.Query2), function(Error, Count) {
					if (Error) {
						Response.json({Signal: false, Error: Error.message});
					} else {
						Response.json({Signal: true, Rows: Count, Time: Date.now() - StartTime});
					}
				});
			} else if (Response.req.query.Action === 'remove') {
				App.Databases.UserDatabase.remove(JSON.parse(Response.req.query.Query), function(Error, Count) {
					if (Error) {
						Response.json({Signal: false, Error: Error.message});
					} else {
						Response.json({Signal: true, Rows: Count, Time: (Date.now() - StartTime).toString() + ' ms'});
					}
				});
			} else {
				Response.json({Signal: false, Error: 'Command not found.'});
			}
		} catch (e) {
			Response.json({Signal: false, Error: e.toString()});
		}
	} else {
		Response.json({Signal: false, Error: 'Unauthorized.'});
	}
});

module.exports = null;
