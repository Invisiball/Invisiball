// Must remain global if onUncaughtException is to work.
App.Apps.HttpServer = require('http').createServer(App.Apps.Express); /**< HTTP server. */
App.Apps.SocketIO = require('socket.io').listen(App.Apps.HttpServer); /**< Socket.IO server. */
App.Modules.PassportSocketIO = require('passport.socketio'); /**< Passport for Socket.IO module. */
App.Modules.SocketIOSessions = require('socket-io.sessions'); /**< Sessions for Socket.IO module. */

// Set up Socket.IO sessions and passport.
App.Apps.SocketIO.set('authorization', App.Modules.SocketIOSessions({
	cookieParser: App.Modules.Express.cookieParser,
	key: 'express.sid',
	secret: 'yawk yawk yawk yawk',
	store: App.Databases.SessionStore
}, App.Modules.PassportSocketIO.authorize({
	cookieParser: App.Modules.Express.cookieParser,
	key: 'express.sid',
	secret: 'yawk yawk yawk yawk',
	store: App.Databases.SessionStore
})));

// Set up Socket.IO vars.
//App.Apps.SocketIO.set('transports', ['jsonp-polling']); // Forced to do this because of https://github.com/Automattic/socket.io/issues/430.
App.Apps.SocketIO.set('log level', /*App.Configs.Global.IsDebugging ? 3 : 1*/ 1); // Logging for or not for App.Configs.Global.IsDebugging.

// Create user in session.
App.Modules.PassPort.serializeUser(function(User, Done) {
	Done(null, User);
});

// Save user session.
App.Modules.PassPort.deserializeUser(function(User, Done) {
	Done(null, User);
});

function Listen() {
	App.Apps.HttpServer.listen(App.Configs.Global.Address.Port);
	App.Console.Log(__filename, App.Utils.LineNumber, ('Listening on http://' + App.Configs.Global.Address.Url.toString() + ':' + App.Configs.Global.Address.Port.toString() + '/ (#' + App.Configs.Global.PID.toString() + ').\n').grey);
}

module.exports = {
	Listen: Listen
};
