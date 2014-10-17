global.path = require('path');

// Backend for getting line number... Ignore...
Object.defineProperty(App.Utils, 'Stack', {
	get: function() {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack) { return stack; };
		var err = new Error();
		Error.captureStackTrace(err, arguments.callee);
		var stack = err.stack;
		Error.prepareStackTrace = orig;
		return stack;
	}
});

// Return the current line number.
Object.defineProperty(App.Utils, 'LineNumber', {
	get: function() {
		return App.Utils.Stack[1].getLineNumber();
	}
});

/**
 * Replaces all find with replace.
 * @param find String to find.
 * @param replace String to replace found with.
 */
String.prototype.Replace = function(find, replace) {
	return this.replace(new RegExp(find, 'g'), replace);
};

/**
 * Makes a path from the string.
 */
Object.defineProperty(String.prototype, 'LocalFilePath', {
	get: function() {
		return __dirname + this;
	}
});

/**
 * Makes a asset path from the string.
 */
Object.defineProperty(String.prototype, 'AssetPath', {
	get: function() {
		return __dirname + '/../../Assets' + this;
	}
});

Object.defineProperty(String.prototype, 'TrimPath', {
	get: function() {
		return path.basename(this);
	}
});

module.exports = null;
