module.exports = function(config) {
	var mongoose = require('mongoose');
	mongoose.connect(config.mongurl);
	var ObjectId = mongoose.Schema.Types.ObjectId;

	var Message = new mongoose.Schema({
		from: { type: ObjectId, ref: 'Player' },
		subject: String,
		body: String,
		isFriendRequest: Boolean,
		sendDate: Number
	});

	var Item = new mongoose.Schema({
		type: String,
		assetPath: String,
		price: Number,
		bodyPart: String,
		weaponType: String,
		armorPoints: Number,
		damagePoints: Number,
		reloadTime: Number,
		initialAmmo: Number,
		maxAmmo: Number,
		canHoldToShoot: Boolean
	});

	var Player = new mongoose.Schema({
		username: String,
		password: String,
		room: Room,
		kills: Number,
		deaths: Number,
		assists: Number,
		money: Number,
		messages: [{ type: ObjectId, ref: 'Message' }],
		friends: [{ type: ObjectId, ref: 'Player' }],
		items: [{ item: { type: ObjectId, ref: 'Item' }, buyDate: Number, isWearing: Boolean, rentTime: Number, weaponPlace: Number }]
	});

	// var Room = function Room(name, password, creator, mode, map) {
	// 	this.name = name;
	// 	this.password = password;
	// 	this.creator = creator;
	// 	this.mode = mode;
	// 	this.map = map;
	// 	this.teams = [];
	// 	this.players = [];
	// 	this._id = __hash__(this);
	// };

	// Room.prototype.isPlayerPresent = function isPlayerPresent(user_id) {
	// 	for (var i = 0, player = this.players[i]; i < this.players.length; player = this.players[++i]) {
	// 		if (player._id === user_id) {
	// 			return true;
	// 		}
	// 	}

	// 	return false;
	// };

	// Room.prototype.removePlayer = function removePlayer(user_id) {
	// 	for (var i = 0, player = this.players[i]; i < this.players.length; player = this.players[++i]) {
	// 		if (player._id === user_id) {
	// 			this.players.splice(i, 1);
	// 			return true;
	// 		}
	// 	}

	// 	return false;
	// };

	var Room = new mongoose.Schema({
		name: String,
		password: String,
		creator: { type: ObjectId, ref: 'Player' },
		mode: Number,
		map: Number,
		teams: [{ score: Number, flag: { taken: Boolean, location: { x: Number, y: Number, z: Number } } }],
		players: [{ user: { type: ObjectId, ref: 'Player' }, kills: Number, deaths: Number, team: Number }]
	});

	return {
		mongoose: mongoose,
		ObjectId: ObjectId,
		players: mongoose.model('Player', Player),
		rooms: mongoose.model('Room', Room), //new RoomManager
		memos: mongoose.model('Memo', Memo),
		items: mongoose.model('Item', Item)
	};
};
