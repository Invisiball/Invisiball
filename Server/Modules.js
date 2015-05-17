App.Modules.Express = require('express'); /**< Express module. */
App.Apps.Express = App.Modules.Express(); /**< Our express app. */
App.Modules.Session = require('express-session'); /**< Session module. */
App.Modules.CookieParser = require('cookie-parser'); /**< Cookie parser module. */
App.Modules.BodyParser = require('body-parser'); /**< Body parser module. */
App.Modules.PassPort = require('passport'); /**< Passport module. */
App.Modules.FileSystem = require('fs'); /**< File system. */
App.Modules.Colors = require('colors'); /**< Colors for output. */
App.Modules.Swig = require('swig'); /**< SWIG templating. */
// App.Modules.SwigExtras = require('swig-extras'); /**< SWIG extra filters and tags. */
App.Modules.Cron = require('cron').CronJob; /**< CRON module. */
App.Modules.Whirlpool = require('../Assets/Js/Utils/Whirlpool.js'); /**< Whirlpool hash function. */

module.exports = null;
