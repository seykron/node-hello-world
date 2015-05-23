var AppContext = require("./lib/AppContext");
var express = require("express");
var app = express();
var config = require("config");
var context = new AppContext(app, __dirname + "/app", config);

if (process.env.NODE_USER) {
  // Drops user privileges.
  process.setuid(process.env.NODE_USER);
}
if (process.env.NODE_GROUP) {
  // Drops group privileges.
  process.setgid(process.env.NODE_GROUP);
}

context.load(function (err) {
  if (err) {
    console.log(err);
    return;
  }
  app.listen(config.port);
  console.log("Application ready at http://localhost:" + config.port);
});
