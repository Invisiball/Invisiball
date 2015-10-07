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

//========== VARS ==========

var rooms = Object.create(null);

//========== MODULES ==========

var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var colors = require('colors');
var moment = require('moment');
var swig = require('swig');
// var swigExtras = require('swig-extras');
var whirlpool = require('./public/js/utils/whirlpool.js');

//========== BUILD APP ==========

var app = express();

//========== START UTILS ==========

require('./lib/utils/line');
log = require('./lib/utils/log')(colors, moment);

//========== START APP VARS & CONFIGS ==========

var config = require('./lib/config')(whirlpool);

//========== START SQLITE JOBS ==========

var db = require('./lib/apps/db')(config, session);

//========== START MAILER SETUP ==========

var sendMail = require('./lib/apps/mail')(config.email);

//========== START SERVER SETUP ==========

var httpServer = require('./lib/server')(config, db, app, express, session, cookieParser, passport);

//========== START AUTH SETUP ==========

require('./lib/auths/google')(config, db, app, passport);
require('./lib/auths/fb')(config, db, app, passport);
require('./lib/auths/twitter')(config, db, app, passport);

//========== START ROUTES SETUP ==========

require('./lib/routes/index')(config, db, app, io, rooms, swig);
require('./lib/routes/me')(config, db, app, rooms, swig);
require('./lib/routes/game')(config, app, io, rooms, swig);
require('./lib/routes/system')(config, app);

//========== START SOCKET.IO ==========

var io = require('./lib/apps/socket')(db, httpServer, rooms, cookieParser);

//========== START PROCESS EVENTS ==========

process.on('exit', function() {
	log.fatal('Exiting...');
	process.exit(0);
});

process.on('SIGINT', function() {
	log.fatal('Interrupted...');
	process.exit(0);
});
