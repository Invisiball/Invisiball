//=================== CONFIGS ====================

App.Configs.Global.IsDebugging = true; /**< Is debugging? */
App.Configs.Global.IsMaintaining = false; /**< Is maintaining? */

App.Configs.Global.PID = parseInt(Math.random() * ((10000000 + 1) - 0) + 0); /**< The PID of this server. */

App.Configs.Global.AdminSecret = function(gen_new) {
	if (gen_new === 'set') {
		App.Configs.Global.AdminSecret.__secret = App.Modules.Whirlpool(App.Configs.Global.PID + (+new Date)).toString();
		return App.Configs.Global.AdminSecret.__secret;
	} else if (gen_new === 'get') {
		return App.Configs.Global.AdminSecret.__secret;
	} else {
		throw new Error('AdminSecret used incorrectly.');
	}
}

App.Configs.Global.Address.Port = process.env.PORT || 80; /**< Port to listen to. */
App.Configs.Global.Address.Url = ''; /**< Base URL to listen to. */

App.Configs.DBUrl = ''; /**< Database URL */

App.Configs.AssetPath = path.normalize(__dirname + '/../Assets');

//==================== EMAIL ====================

// Set up mail.
App.Emails.Google.Account = {
	Email: '', // Enter your Gmail email ...
	Password: '' // ... and password.
};

//=================== AUTHS ===================

// Facebook client data.
App.Auths.Facebook.ClientInfo = Object.freeze({
	Id: '', // Client ID.
	Secret: '', // Client secret.
	Redirect: 'http://' + App.Configs.Global.Address.Url + '/Auths/Facebook/Return' // Client redirect URL.
});

// Google client data.
App.Auths.Google.ClientInfo = Object.freeze({
	Id: '', // Client ID.
	Secret: '', // Client secret.
	Redirect: 'http://' + App.Configs.Global.Address.Url + '/Auths/Google/Return' // Client redirect URL.
});

// Twitter client data.
App.Auths.Twitter.ClientInfo = Object.freeze({
	Key: '', // Consumer ID.
	Secret: '', // Consumer secret.
	Redirect: 'http://' + App.Configs.Global.Address.Url + '/Auths/Twitter/Return' // Client redirect URL.
});

module.exports = null;
