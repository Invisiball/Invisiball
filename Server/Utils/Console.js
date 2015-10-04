/**
 * Pretty-prints message with line number.
 */
App.Console.Log = function(file, line, t) {
	if (App.Configs.Global.IsDebugging) {
		console.log('[' + path.basename(file) + ':' + line.toString() + '] ' + t.toString());
	}
};

/**
 * Pretty-prints error with line number.
 */
App.Console.Error = function(file, line, t) {
	if (App.Configs.Global.IsDebugging) {
		console.error(('[' + path.basename(file) + ':' + line.toString() + '] ' + t.toString()).red);
	}
};

/**
 * Pretty-prints, throws, and ends the server.
 * @see App.Console.Error
 */
App.Console.Throw = function(file, line, t) {
	var getStackTrace = function() {
		var obj = {};
		Error.captureStackTrace(obj, getStackTrace);
		return obj.stack;
	};

	App.Console.Error(file, line, JSON.stringify(t, null, 4) + '\n' + getStackTrace().toString());

	process.exit(1);
}

module.exports = null;
