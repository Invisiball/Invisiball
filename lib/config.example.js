//=================== CONFIG ====================

module.exports = function initConfigModule(whirlpool) {
	var path = require('path');

	var config = {};

	config.isDebugging = true; /**< Is debugging? */
	config.isMaintaining = false; /**< Is maintaining? */

	config.pid = ~~(Math.random() * ((10000000 + 1) - 0) + 0); /**< The PID of this server. */

	config.adminSecret = whirlpool(config.pid + +new Date);

	config.address = {
		port: process.env.PORT || 80, /**< Port to listen to. */
		url: '' /**< Base URL to listen to. */
	};

	config.dbUrl = ''; /**< Database URL */

	config.assetPath = path.normalize(__dirname + '/../public');

	//==================== EMAIL ====================

	// Set up mail.
	config.email = {
		service: '', // Enter service name (ex: Gmail).
		email: '', // Enter your email ...
		pass: '' // ... and password.
	};

	//=================== AUTHS ===================

	// Auth data. «« Uncomment to use. »»
	config.auth = {
		// // Facebook client data.
		// fb: {
		// 	clientID: '', // Client ID.
		// 	clientSecret: '', // Client secret.
		// 	callbackURL: 'http://' + config.address.url + '/auths/fb/return' // Client redirect URL.
		// }

		// // Google client data.
		// google: {
		// 	clientID: '', // Client ID.
		// 	clientSecret: '', // Client secret.
		// 	callbackURL: 'http://' + config.address.url + '/auths/google/return' // Client redirect URL.
		// }

		// // Twitter client data.
		// twitter: {
		// 	consumerKey: '', // Consumer key.
		// 	consumerSecret: '', // Consumer secret.
		// 	callbackURL: 'http://' + config.address.url + '/auths/twitter/return' // Client redirect URL.
		// }
	};

	//=================== VARS ===================

	config.clientCodes = {
		twitter: 1,
		google: 2,
		fb: 3
	};

	config.responseCodes = {
		ok: 200,
		notFound: 404,
		incorrectRequest: 400,
		conflict: 409,
		error: 500
	};

	//=================== VALIDATE ===================

	(function validateConfig(c) {
		if (!c) {
			throw new Error('Config does not exist');
		}

		var fs = require('fs');

		if (typeof c.isDebugging !== 'boolean') { c.isDebugging = !!c.isDebugging; log.warn(`Forcing debugging flag to ${c.isDebugging}`); }
		if (typeof c.isMaintaining !== 'boolean') { c.isMaintaining = !!c.isMaintaining; log.warn(`Forcing maintaining flag to ${c.isMaintaining}`); }
		if (!c.pid) { throw new Error('Server pid is falsey'); }
		if (!c.adminSecret) { throw new Error('Server administrator secret is falsey'); }
		if (!c.address || !c.address.port || !c.address.url) { throw new Error('Server address is misconfigured'); }
		if (!c.dbUrl) { throw new Error('Database url is misconfigured'); }
		if (!c.assetPath || !fs.lstatSync(c.assetPath).isDirectory()) { throw new Error('Asset directory does not exist'); }
		if (!c.email) { throw new Error('Config email object is falsey'); }
		if (!c.email.service || !c.email.email || !c.email.pass) { log.warn('Email config is misconfigured'); }
		if (!c.auth) { c.auth = {}; log.warn('No auth config, filling auth config with empty object'); }
		if (!c.clientCodes) { throw new Error('No client codes object, please see example config file to restore'); }
		if (!c.responseCodes) { throw new Error('No response codes object, please see example config file to restore'); }
	})(config);

	return config;
};
