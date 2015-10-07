module.exports = function initSystemRouterModule(config, app) {
	// Some IP test...
	app.get('/ip', function(req, res) {
		res.send({'req.ip': req.ip,
				  'req.ips': req.ips,
				  'req.connection.remoteAddress': req.connection.remoteAddress});
	});

	// 404.
	app.get('*', function(req, res) {
		res.send(config.responseCodes.notFound, 'Cannot find "' + req.url + '".');
	});
};
