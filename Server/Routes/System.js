App.Apps.Express.get('/IP', function(req, res) {
	res.send({'req.ip': req.ip,
			  'req.ips': req.ips,
			  'req.connection.remoteAddress': req.connection.remoteAddress});
});

// Maintenance page.
App.Apps.Express.get('/Maintenance', function(Request, Response) {
	if (App.Configs.Global.IsMaintaining) { // If maintaining, send maintenance file.
		Response.send(App.Vars.ResponseCodes.Ok, App.Modules.Swig.renderFile(App.Configs.AssetPath + '/Html/Maintenance.html', {
			IsAuthenticated: !!Request.user, // Is authenticated?
			Me: Request.user, // Me
			Err: Response.req.query.Error // Error
		}));
	} else { // Otherwise, redirect to home.
		Response.redirect('/');
	}
});

// 404.
App.Apps.Express.get('*', App.Apps.Express.MiddleWare.CheckForMaintenance, function(Request, Response) {
	// Tell user we could not find the requested url.
	Response.send(App.Vars.ResponseCodes.NotFound, 'Cannot find "' + Request.url + '".');
	// Response.redirect('/?Error=Cannot find "' + Request.url + '".');
});

module.exports = null;
