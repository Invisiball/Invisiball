var fmt = require('util').format;
var EventEmitter = require('events').EventEmitter;

var utils = {
	path: require('path'),
	colors: require('colors/safe'),
	moment: require('moment'),
	extend: require('xtend'),
	whirlpool: require('./utils/whirlpool'),
	randID: function() {
		var arg = '', keys = Object.keys(arguments);
		for (var iter = 0; iter < keys.length; iter++) {
			arg += '' + arguments[keys[iter]];
		}
		return this.whirlpool(arg + (+new Date()).toString());
	}
};

Object.defineProperty(utils, 'stack', {
	get: function() {
		return new Error().stack.replace('Error\n', ' ').replace(/\s\s\s\s\s/g, '\n');
	}
});

Object.defineProperty(utils, '_stack', {
	get: function() {
		var orig = Error.prepareStackTrace;
		Error.prepareStackTrace = function(_, stack) { return stack; };
		var err = new Error;
		Error.captureStackTrace(err, arguments.callee);
		var stack = err.stack;
		Error.prepareStackTrace = orig;
		return stack;
	}
});

Object.defineProperty(utils, 'line', {
	get: function() {
		return utils._stack[1].getLineNumber();
	}
});

/*!
 * log.js
 * https://www.npmjs.org/package/log
 *
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 *
 * Edited by Usandfriends <https://github.com/usandfriends>.
 */

var Log = exports = module.exports = function Log(level, stream) {
	(typeof level === 'string') && (level = exports[level.toUpperCase()]);

	this.level = level || exports.DEBUG;
	this.stream = stream || process.stdout;
}

{
	var iterator = 0;

	exports.FATAL = iterator++;
	exports.ERROR = iterator++;
	exports.WARN  = iterator++;
	exports.DEBUG = iterator++;
	exports.INFO  = iterator++;
}

Log.prototype = {
	log: function log(levelStr, /*file, line,*/ color, args) {
		if (exports[levelStr] <= this.level) {
			this.stream.write(color(
				//'(' + utils.path.basename(file) + ':' + line + ') ' +
				'[' + utils.moment().format('L HH:mm:ss') + '] ' +
				// levelStr + ' ' +
				fmt.apply(null, args/*Array.prototype.slice.call(args, 2, Infinity)*/) + '\n'
			));
		}
	},
	fatal: function fatal(/*file, line,*/ msg) {
		this.log('FATAL', /*file, line,*/ utils.colors.red.bold, arguments);
	},
	error: function error(/*file, line,*/ msg) {
		this.log('ERROR', /*file, line,*/ utils.colors.red, arguments);
	},
	warn: function warning(/*file, line,*/ msg) {
		this.log('WARN', /*file, line,*/ utils.colors.yellow, arguments);
	},
	debug: function debug(/*file, line,*/ msg) {
		this.log('DEBUG', /*file, line,*/ utils.colors.grey, arguments);
	},
	info: function info(/*file, line,*/ msg) {
		this.log('INFO', /*file, line,*/utils.colors.white, arguments);
	}
};

Log.prototype.__proto__ = EventEmitter.prototype;

/* log.js end */

utils.log = new Log('info');

module.exports = utils;
