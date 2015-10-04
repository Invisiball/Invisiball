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

module.exports = null;
