// Maintenance CRON job.
App.Jobs.Maintenance = new App.Modules.Cron('00 00 00 * * *', function() { // Every day, at midnight.
		// App.Configs.Global.IsMaintaining = true; // Start maintenance on static pages.
		// App.Apps.SocketIO.sockets.emit('maintenance'); // Start maintenance on SocketIO server.

		// Get all users.
		App.Databases.UserDatabase.find({}).count(function(Error, Count) {
			// Send log.
			App.Emails.Google.Emailer.sendMail({
				from: 'Invisiball Maintenance Job <' + App.Emails.Google.Account.Email + '>',
				to: App.Emails.Google.Account.Email,
				subject: 'Daily Maintenance Job',
				html: '<h1>Daily Maintenance Job Log</h1>' +
					  '<b>At: ' + (new Date()).toString() + '</b>' +
					  '<br><br><br>' +
					  '<table class="table table-hover">' +
					  	'<tbody>' +
					  		'<tr>' +
					  			'<td><b>Entries Parsed</b></td>' +
					  			'<td>' + Count + ' ENTRIES</td>' +
					  		'</tr>' +
					  		'<tr>' +
					  			'<td><b>Final Server State</b></td>' +
					  			'<td>STABLE ✔</td>' +
					  		'</tr>' +
					  	'</tbody>' +
					  '</table>'
			}, function(Error, Response) {
				if (Error) { // Error!
					App.Console.Throw(__filename, App.Utils.LineNumber, Error);
				}

				// App.Configs.Global.IsMaintaining = false; // Stop maintenance.

				App.Console.Log(__filename, App.Utils.LineNumber, 'Sent maintenance log successfully!'.green);
			});
		});
	}, null, false, 'America/Los_Angeles'
);

App.Jobs.Maintenance.start();

module.exports = null;
