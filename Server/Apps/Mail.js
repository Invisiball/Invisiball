App.Modules.NodeMailer = require('nodemailer'); /**< Nodemailer module. */

App.Emails.Google.Emailer = App.Modules.NodeMailer.createTransport('SMTP', {
	service: 'Gmail',
	auth: {
		user: App.Emails.Google.Account.Email,
		pass: App.Emails.Google.Account.Password
	}
});

module.exports = null;
