module.exports = function initDatabaseModule(config, session) {
	var db = {};

	var mongoose = require('mongoose');
	mongoose.connect(config.dbUrl);

	db.users = db.user = mongoose.model('User', new mongoose.Schema({
		cid: String,
		email: String,
		username: String,
		client: Number,
		kills: Number,
		deaths: Number,
		shots: Number
	}, {
		emitIndexErrors: true,
		timestamps: true
	}));

	var mongoStore = require('connect-mongo')(session);
	db.sessions = new mongoStore({ url: config.dbUrl });

	return db;
};
