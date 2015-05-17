App.Modules.MongoDB = require('mongodb').MongoClient; /**< Mongo module. */
App.Modules.MongoStore = require('connect-mongo')(App.Modules.Session); /**< Mongo session store. */

App.Modules.MongoDB.connect(App.Vars.DBUrl, function(Error, DataBase) {
	if (Error) {
		App.Console.Throw(__filename, App.Utils.LineNumber, Error);
	}

	App.Databases.Database = DataBase;
	App.Databases.UserDatabase = App.Databases.Database.collection('users');
	App.Databases.Database.ensureIndex('users', { Username: 'text' }, function(Error) {
		if (Error) {
			App.Console.Throw(__filename, App.Utils.LineNumber, Error);
		}
	});
});

App.Databases.SessionStore = new App.Modules.MongoStore({ url: App.Vars.DBUrl });

module.exports = null;
