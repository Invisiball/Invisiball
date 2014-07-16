/*
 * 0, length, context, selector, clear, export_view, import_view, exec, lo
 * gin, settings, commands, setInterpreter, greetings, paused, pause, resu
 * me, cols, rows, history, next, focus, enable, disable, enabled, signatu
 * re, version, cmd, get_command, set_command, insert, set_prompt, get_pro
 * mpt, set_mask, get_output, resize, flush, echo, error, exception, scrol
 * l, logout, token, login_name, name, prefix_name, push, pop, level, rese
 * t, purge, destroy,
 */

function $post(url) {
	var response = $.ajax({
		type: "POST",
		url: url,
		async: false
	}).responseText;

	try {
		return JSON.parse(response);
	} catch (e) {
		return response;
	}
}

function argsplit(args) {
	var reg = /(?:")([^"]+)(?:")|([^\s"]+)(?=\s+|$)/g, res = [], arr = null;

	while (arr = reg.exec(args)) {
		res.push(arr[1] ? arr[1] : arr[0]);
	}

	return res;
}

$('body').terminal(function(args, term) {
	var args = argsplit(args);

	switch(args[0]) {
		case '': {
			term.echo('Enter \'help\' for more information.');
			break;
		}

		case 'do': {
			if (args.length < 3) {
				term.echo('Reference for \'do\':\n' +
						  '    do [rows|run] \"query\"\n' +
						  '    [rows|run]:\n' +
						  '        rows: If you are running a query.\n' +
						  '        run: If you are running a command.\n' +
						  '    \"query\"\n' +
						  '        The query or command.');
			} else {
				var data = $post('/MyAdmin/Do/?Secret=' + window.localStorage['body_0_token'] + '&Action=' + args[1] + '&Query=' + args[2]);
				data.Signal ? (term.echo(JSON.stringify(data, null, 4), {
						'finalize': function(div) {
							div.css('color', 'green');
						}
					})) : term.error(JSON.stringify(data, null, 4));
			}

			break;
		}

		case 'help': {
			term.echo('Commands:\n' +
					  '    clear  - Clears the console.\n' +
					  '    do     - Do actions.\n' +
					  '    help   - Prints out this prompt.\n' +
					  '    logout - Logout\'s the user.');

			break;
		}

		case 'logout': {
			term.logout();
			term.clear();
			term.error('Remote client has disconnected.');

			break;
		}

		default: {
			term.error(args[0] + ': Function does not exist.');
		}
	}
}, {
	login: function(user, password, callback) {
		var data = $post('/MyAdmin/Login?Username=' + user + '&Password=' + password);

		if (data === 'Maintenance') {
			window.location.replace('/Maintenance');
		} else if (data.Signal === true) {
			callback(data.SecretToken);
		} else {
			callback(null);
		}
	},
	greetings: 'Welcome!',
	prompt: '>>> ',
	exit: false
});
