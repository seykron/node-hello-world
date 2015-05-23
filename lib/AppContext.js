module.exports = function AppContext(app, directory, config) {

  /** Current module instance. */
  var context = this;

  /** Node's path API. */
  var path = require("path");

  /** Node's file system API.
   * @type {Object}
   */
  var fs = require("fs");

  /** Directory to configure views in express. */
  var VIEWS_DIR = path.join(directory, "views");

  /** Directory to configure static resources in express. */
  var ASSETS_DIR = path.join(directory, "assets");

  /** Directory where render engines will look for layout templates. */
  var LAYOUTS_DIR = path.join(VIEWS_DIR, "layouts");

  /** Directory where render engines will look for partials templates. */
  var PARTIALS_DIR = path.join(VIEWS_DIR, "partials");

  /** Directory to load controllers from. */
  var CONTROLLERS_DIR = path.join(directory, "controllers");

  /** Directory which contains domain entities and repositories. */
  var DOMAIN_DIR = path.join(directory, "domain");

  /** Directory to load helpers. */
  var HELPERS_DIR = path.join(directory, "helpers");

  /** Domain components defined in the context's domain directory. It inherits
   * the domain specified by configuration.
   * @type {Object}
   */
  var DOMAIN = (function () {
    var domain = {};

    if (fs.existsSync(DOMAIN_DIR)) {
      fs.readdirSync(DOMAIN_DIR).forEach(function (file) {
        var name = path.basename(file, ".js");

        domain[name] = require(path.join(DOMAIN_DIR, file));
      });
    }

    return domain;
  }());

  /** MySQL data source. */
  var MySqlDataSource = require("./MySqlDataSource");

  /** Express.js framework.
   * @type {Object}
   */
  var express = require("express");

  /** Default logger. */
  var debug = require("debug")("Loader");

  /** Handlebars render engine. */
  var hbs = require("express-handlebars");

  /** Utility to create mixins.
   * @type {Function}
   */
  var extend = require("extend");

  /** Async execution utilities. */
  var async = require("async");

  /** Middleware to expose the context to the frontend.
   * @type {Function}
   */
  var contextMiddleware = require("./contextMiddleware");

  /** Middleware to bind a MySQL connection to a request.
   * @type {Function}
   */
  var transactionMiddleware = require("./transactionMiddleware");

  /** Configured data source, if any. */
  var dataSource;

  /** Loads application controllers from the default directory. */
  var loadControllers = function () {
    fs.readdirSync(CONTROLLERS_DIR).forEach(function (file) {
      var fullPath = path.join(CONTROLLERS_DIR, file);
      var endpoint;

      if (fs.statSync(fullPath).isFile()) {
        debug("loading controller %s", file);

        endpoint = require(fullPath);
        endpoint(context);
      }
    });
  };

  // Constructor method.
  (function __initialize() {
    // General configuration.
    app.engine('html', hbs({
      defaultLayout: 'main.html',
      helpers: require(path.join(HELPERS_DIR, "viewHelpers.js"))(app),
      layoutsDir: LAYOUTS_DIR,
      partialsDir: PARTIALS_DIR,
      extname: ".html"
    }));

    app.set("views", VIEWS_DIR);
    app.set("view engine", "handlebars");

    // General purpose middlewares.
    app.use(require('express-domain-middleware'));
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(express.cookieParser());

    // Static resources.
    app.use("/", express.static(ASSETS_DIR));

    app.locals = {
      config: config
    };
  }());

  return extend(context, {

    /** Domain components defined in the context's domain directory. It inherits
     * the domain specified by configuration.
     */
    domain: DOMAIN,

    /** Loads the application context.
     * @param {Function} callback Receives an error as parameter. Cannot be
     *    null.
     */
    load: function (callback) {
      async.series([
        function setupDataSource(next) {
          if (!config.dataSource) {
            return next();
          }
          dataSource = new MySqlDataSource(config.dataSource,
            path.join(__dirname, "..", "support", "sql"));

          if (config.dataSource.drop) {
            dataSource.cleanDatabase(next);
          }
        },
        function init(next) {
          app.use(contextMiddleware(context));
          app.use(transactionMiddleware(context));

          loadControllers();
          next();
        }
      ], callback);
    },

    /** Returns the context configuration.
     *
     * @return {Object} an object with the configuration specified in the
     *    configuration files at directory <code>conf/</code>, never null.
     */
    getConfiguration: function () {
      return config;
    },

    /** Returns the related express application.
     * @return {Object} a valid express.js application, never null.
     */
    getApplication: function () {
      return app;
    },

    /** Indicates whether this context is loaded in debug mode.
     * @return {Boolean} true if the context is in debug mode, false otherwise.
     */
    isDebugMode: function () {
      return config.debugMode;
    },

    /** Returns the configured data source, if any.
     * @return A valid data source or null if none configured.
     */
    getDataSource: function () {
      return dataSource;
    }
  });
};
