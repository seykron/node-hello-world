/** This middleware binds the <code>context</code> model attribute to the
 * current application context configuration.
 */
module.exports = function (context) {

  return function moduleMiddleware(req, res, next) {
    res.locals.context = context.getConfiguration().context;
    next(null);
  };
};
