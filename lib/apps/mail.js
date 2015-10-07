module.exports = function initMailModule(emailAccount) {
	var nodeMailer = require('nodemailer'); /**< Nodemailer module. */

	return nodeMailer.createTransport({
		service: emailAccount.service,
		auth: {
			user: emailAccount.email,
			pass: emailAccount.password
		}
	});
};
