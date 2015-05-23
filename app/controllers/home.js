module.exports = function (context) {

  /** Default logger. */
  var debug = require("debug")("home");

  /** Express.js application, it is never null. */
  var app = context.getApplication();

  app.get("/", function (req, res) {

    var itemsRepository = new context.domain.ItemRepository(context, req.db);

    itemsRepository.list(function (err, items) {
      if (err) {
        return res.send(500, err);
      }
      res.render("home.html", {
        items: items
      });
    });
  });
};
