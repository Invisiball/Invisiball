/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Usandfriends
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

////////// INVISIBALL //////////

//========== BUILD APP ==========

global.App = require('./Server/App');

//========== START UTILS ==========

require('./Server/Utils/LineNumber');
require('./Server/Utils/Console');

//========== START NODEJS VARS ==========

require('./Server/Modules');

//========== START APP VARS & CONFIGS ==========

require('./Server/Vars');
require('./Server/Configs');

//========== START SQLITE JOBS ==========

require('./Server/Apps/Database');

//========== START MAILER SETUP ==========

require('./Server/Apps/Mail');

//========== START SERVER SETUP ==========

require('./Server/MiddleWare');
var Server = require('./Server/Server');

//========== START AUTH SETUP ==========

require('./Server/Auths/G+');
require('./Server/Auths/FB');
require('./Server/Auths/Twitter');

//========== START ROUTES ==========

require('./Server/Routes/Me');
require('./Server/Routes/Index');
require('./Server/Routes/Game');
require('./Server/Routes/System');

//========== START SOCKET.IO ==========

require('./Server/Apps/Socket');

//========== START CRON JOBS ==========

require('./Server/Apps/Cron');

//========== START PROCESS EVENTS ==========

process.on('exit', function() {
	App.Console.Error(__filename, App.Utils.LineNumber, 'Cleaning up...');
	// App.Databases.UserDatabase.close();
	process.exit();
});

process.on('SIGINT', function() {
	process.exit();
});

//========== START ==========

Server.Listen();
