module.exports = function initDatabaseModule(config, session) {
	var db = {};

	var mongoClient = require('mongodb').MongoClient; /**< Mongo module. */
	var mongoStore = require('connect-mongo')(session); /**< Mongo session store. */

	mongoClient.connect(config.dbUrl, function(err, db_) {
		if (err) {
			throw err;
		}

		db.raw = db_;
		db.users = db.raw.collection('users');
		db.raw.ensureIndex('users', { username: 'text' }, function(err) {
			if (err) {
				throw err;
			}
		});
	});

	db.sessions = new mongoStore({ url: config.dbUrl });

	return db;
};
