//=================== CONFIGS ====================

App.Configs.Global.IsDebugging = false; /**< Is debugging? */
App.Configs.Global.IsMaintaining = false; /**< Is maintaining? */

App.Configs.Global.PID = parseInt(Math.random() * ((10000000 + 1) - 0) + 0); /**< The PID of this server. */

App.Configs.Global.AdminSecret = App.Modules.Whirlpool(App.Configs.Global.PID).toString();

App.Configs.Global.Address.Port = process.env.PORT || 80; /**< Port to listen to. */
App.Configs.Global.Address.Url = ''; /**< Base URL to listen to. */

//==================== OTHER ====================

App.Vars.DBUrl = ''; /**< Database URL */

// Set up mail.
App.Emails.Google.Account = {
	Email: '', // Enter your Gmail email ...
	Password: '' // ... and password.
};

//========== AUTHS ==========

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
