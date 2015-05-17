module.exports = function(utils) {
	var fs = require('fs');

	return {
		dev: true,
		http_port: process.env.PORT || 3000,
		https_port: process.env.HTTPS_PORT || 3443,
		mongurl: 'mongodb://localhost:27017/invisiball',
		secret: utils.whirlpool('even in my will keep it trill'),
		ssl: {
			// key: fs.readFileSync('ssl/invisiball.key'),
			// cert: fs.readFileSync('ssl/invisiball.crt')
		}
	};
};
