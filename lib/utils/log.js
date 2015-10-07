/*!
 * log.js
 * https://www.npmjs.org/package/log
 *
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 *
 * Edited by Usandfriends <https://github.com/usandfriends>.
 */

module.exports = function initLogModule(colors, moment) {
	var fmt = require('util').format;

	var Log = function Log(level, stream) {
		(typeof level === 'string') && (level = Log.types[level.toUpperCase()]);

		this.level = level || Log.types.DEBUG;
		this.stream = stream || process.stdout;
	}

	{
		var iterator = 0;

		Log.types = {
			FATAL: ++iterator,
			ERROR: ++iterator,
			WARN: ++iterator,
			DEBUG: ++iterator,
			INFO: ++iterator
		};
	}

	Log.prototype = {
		log: function log(levelStr, /*file, line,*/ color, args) {
			if (Log.types[levelStr] <= this.level) {
				this.stream.write(color(
					//'(' + path.basename(file) + ':' + line + ') ' +
					'[' + moment().format('L HH:mm:ss') + '] ' +
					// levelStr + ' ' +
					fmt.apply(null, args/*Array.prototype.slice.call(args, 2)*/) + '\n'
				));
			}
		},
		fatal: function fatal(/*file, line,*/ msg) {
			this.log('FATAL', /*file, line,*/ colors.red.bold, arguments);
		},
		error: function error(/*file, line,*/ msg) {
			this.log('ERROR', /*file, line,*/ colors.red, arguments);
		},
		warn: function warning(/*file, line,*/ msg) {
			this.log('WARN', /*file, line,*/ colors.yellow, arguments);
		},
		debug: function debug(/*file, line,*/ msg) {
			this.log('DEBUG', /*file, line,*/ colors.grey, arguments);
		},
		info: function info(/*file, line,*/ msg) {
			this.log('INFO', /*file, line,*/colors.white, arguments);
		}
	};

	Log.prototype.__proto__ =  require('events').EventEmitter.prototype;

	return new Log('info');
};
