App.Vars.ResponseCodes = Object.freeze({
	Ok: 200, // Okay.
	NotFound: 404, // Could not find resource.
	IncorrectRequest: 400, // Incorrect request.
	Conflict: 409, // Conflict.
	Err: 500 // Internal error.
}); /**< Response code constants. */

App.Vars.ClientCodes = Object.freeze({
	Twitter: 1, // Twitter client code.
	Google: 2, // Google client code.
	Facebook: 3 // Facebook client code.
}); /**< Client code constants. */

App.Vars.HasClient = Object.seal({
	Twitter: false,
	Google: false,
	Facebook: false
}); /**< If the client exists, set to true. */

App.Vars.Rooms = {}; /**< Room data. */

module.exports = null;
