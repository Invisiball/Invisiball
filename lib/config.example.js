//=================== CONFIG ====================

module.exports = function initConfigModule(whirlpool) {
	var config = {};

	config.isDebugging = true; /**< Is debugging? */
	config.isMaintaining = false; /**< Is maintaining? */

	config.pid = '' + (Math.random() * ((10000000 + 1) - 0) + 0); /**< The PID of this server. */

	config.adminSecret = whirlpool(config.pid + +new Date);

	config.address = {
		port: process.env.PORT || 80, /**< Port to listen to. */
		address_url: '' /**< Base URL to listen to. */
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

	return config;
};
