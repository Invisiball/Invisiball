// Maintenance CRON job.
App.Jobs.Maintenance = new App.Modules.Cron('00 00 00 * * *', function() { // Every day, at midnight.
		// App.Configs.Global.IsMaintaining = true; // Start maintenance on static pages.
		// App.Apps.SocketIO.sockets.emit('maintenance'); // Start maintenance on SocketIO server.

		// Get all users.
		App.Databases.UserDatabase.find({}, { sort: [['Kills', 'desc']] }).toArray(function(Error, Users) {
			if (Error) {
				App.Console.Throw(__filename, App.Utils.LineNumber, Error);
			}

			var timeStart = +new Date;

			for (var iter = 0; iter < Users.length; iter++) {
				App.Databases.UserDatabase.update({ _id: Users[iter]._id }, { $set: { Place: iter + 1 } }, function(Error) {
					if (Error) {
						App.Console.Throw(__filename, App.Utils.LineNumber, Error);
					}
				});
			}

			// Send log.
			App.Emails.Google.Emailer.sendMail({
				from: 'Invisiball Maintenance Job <' + App.Emails.Google.Account.Email + '>',
				to: App.Emails.Google.Account.Email,
				subject: 'Daily Maintenance Job',
				html: '<h1>Daily Maintenance Job Log</h1>' +
					  '<b>At: ' + (new Date()).toString() + '</b>' +
					  '<br><br><br>' +
					  '<table>' +
					  	'<tbody>' +
					  		'<tr>' +
					  			'<td><b>Entries Parsed</b></td>' +
					  			'<td>' + Users.length + ' ENTRIES</td>' +
					  		'</tr>' +
					  		'<tr>' +
					  			'<td><b>Done In</b></td>' +
					  			'<td>' + ((+new Date) - timeStart) + ' ms</td>' +
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
