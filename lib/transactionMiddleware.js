module.exports = function(context) {

  /** Express application, it is never null. */
  var app = context.getApplication();

  /** Application context datasource, it is never null. */
  var dataSource = context.getDataSource();

  /** Sets up the proxy for the specified connection. It commits or rollbacks
   * the transaction when the response is finished or closed.
   * @param {Object} req Express request instance. Cannot be null.
   * @param {Object} res Express response instance. Cannot be null.
   * @param {Object} conn Current connection. Cannot be null.
   * @private
   */
  var setupTransactionProxy = function (req, res, conn) {
    var rollback = conn.rollback;
    var rollbackOnly = false;

    var closeTransaction = function (err) {
      if (err) {
        console.log("Error terminating transaction: " + err);
      }
    };
    var handleTransaction = function () {
      if (rollbackOnly) {
        console.log("Transaction invalidated, force rollback.");
        rollback.apply(conn, [closeTransaction]);
      } else {
        conn.commit(closeTransaction);
      }
      try {
        conn.release();
      } catch (err) {
        console.log("WARN: cannot release connection.", err);
      }
    };
    conn.rollback = function (callback) {
      rollbackOnly = true;
      setImmediate(callback);
    };
    // Request terminanted unexpectedly.
    res.on("close", function () {
      rollbackOnly = true;
      handleTransaction();
    });
    // Normal response flow.
    res.on("finish", handleTransaction);
  };

  /** Checks whether the specified request belongs to a mapped route or not.
   * @param {Object} req Express request instance. Cannot be null.
   * @return {Boolean} Returns true if the current request belongs to a
   *    registered route, false otherwise.
   * @private
   */
  var matches = function (req) {
    var verb;
    var routes;
    var matching;
    var matchRoute = function (route) {
      return route.path === req.path;
    };

    for (verb in app.routes) {
      if (app.routes.hasOwnProperty(verb)) {
        routes = app.routes[verb];
        matching = routes.some(matchRoute);

        if (matching) {
          return true;
        }
      }
    }

    return false;
  };

  /** Middleware to setup a MySQL transaction during requests. It takes a
   * connection from the pool, sets up proxy for response methods and begins the
   * transaction. It also adds the <code>db</code> attribute to the
   * request. Only requests to registered routes are transactional.
   *
   * @param {HttpRequest} req Current request. Cannot be null.
   * @param {HttpResponse} res Current response. Cannot be null.
   * @param {Function} next Callback to follow to the next middleware. Cannot be
   *    null.
   */
  return function transactionMiddleware(req, res, next) {
    if (req.db || !dataSource || !matches(req)) {
      next(null);
    } else {
      dataSource.getConnection(function (err, conn) {
        if (err) {
          return next(err);
        }
        req.db = conn;

        conn.beginTransaction(function (err) {
          if (err) {
            console.log("ERR: cannot open transaction:", err);
            return next(err);
          }
          setupTransactionProxy(req, res, conn);
          next(null);
        });
      });
    }
  };
};