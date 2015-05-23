/** Represents the data source to access a MySQL database.
 * @constructor
 */
module.exports = function MySqlDataSource(config, dataDir) {

  /** Name of the standard property for auto incremental identifiers.
   * @constant
   */
  var ID_PROPERTY = "id";

  /** Node's File System API.
   * @type {Object}
   * @private
   * @fieldOf DataSource#
   */
  var fs = require("fs");

  /** Node's Path API.
   * @type {Object}
   * @private
   * @fieldOf DataSource#
   */
  var path = require("path");

  /** Default logger. */
  var debug = require("debug")("MySqlDataSource");

  /** MySQL driver.
   * @type {Object}
   * @private
   * @methodOf DataSource#
   */
  var mysql = require('mysql');

  /** MySQL connection pool.
   * @type {Object}
   * @private
   * @methodOf DataSource#
   */
  var pool  = mysql.createPool(config, {
    waitForConnections: true,
    connectionLimit : 25
  });

  /** Converts a list of objects to a single SQL INSERT statement. It adds
   * ON DUPLICATE KEY UPDATE statement to update existing rows.
   *
   * @param {String} table Name of the table the rows belong to. Cannot be null
   *    or empty.
   * @param {Object[]} rows List of objects to convert to SQL. Cannot be null.
   * @return {String} the SQL statements for the specified list of objects,
   *    or null if there's no row to convert.
   */
  var buildInsert = function (table, rows) {
    var insertQuery = "insert into ?? (??) values ? ";
    var updateQuery = "on duplicate key update ";
    var fieldNames;
    var bulkInserts;

    if (rows.length === 0) {
      return null;
    }

    // Generates field names.
    fieldNames = Object.keys(rows[0]);
    fieldNames.forEach(function (property, index) {
      // Id fields must not be updated.
      if (property !== ID_PROPERTY) {
        updateQuery += property + " = VALUES(" + property + ")";

        if (index < fieldNames.length - 1) {
          updateQuery += ",";
        }
      }
    });

    // Generates a nested array to let mysql driver generate the bulk inserts.
    // [[valA1, valA2, valAn], [va]B1, valB2, valBn], ...]
    bulkInserts = rows.map(function (row) {
      return Object.keys(row).map(function (key) {
        return row[key];
      });
    });

    insertQuery = mysql.format(insertQuery, [table, [fieldNames], bulkInserts]);

    return insertQuery + " " + updateQuery;
  };


  /** Creates the database structure.
   * @param {Function} callback Receives an error. Cannot be null.
   * @private
   * @methodOf DataSource#
   */
  var createDatabase = function (conn, callback) {
    var ddl = fs.readFileSync(path.join(dataDir, "db-setup.sql")).toString();
    var statements = ddl.split(";");

    debug("Loading MySQL data...");

    var execNext = function (statement) {
      var query;

      if (!statement) {
        callback(null);
        return;
      }
      query = statement.replace(/^\s+|\s+$/, "");

      if (query) {
        conn.query(query, function (err, result) {
          if (err) {
            debug(query);
            callback(err);
          } else {
            execNext(statements.shift());
          }
        });
      } else {
        execNext(statements.shift());
      }
    };

    fs.readdir(path.join(dataDir, "db-setup.d"), function (err, files) {
      if (err) {
        throw new Error("Cannot read SQL directory.");
      }
      files.sort().forEach(function (file) {
        var data = fs.readFileSync(path.join(dataDir, "db-setup.d", file))
          .toString();
        var jsonStatements;
        var jsonData;

        if (file.substr(-4) === "json") {
          jsonData = JSON.parse(data);
          jsonStatements = buildInsert(jsonData.table, jsonData.data);
          statements = statements.concat(jsonStatements + ";");
        } else {
          statements = statements.concat(data.split(";"));
        }
      });
      execNext(statements.shift());
    });
  };

  return {

    /** Opens the connection to the data source.
     * @param {Function} callback Receives an error. Cannot be null.
     */
    cleanDatabase: function (callback) {
      pool.getConnection(function (err, conn) {
        if (err) {
          callback(err);
          return;
        }
        createDatabase(conn, function (err) {
          if (err) {
            return callback(err);
          }
          conn.release();
          callback(err);
        });
      });
    },

    /** Gets a connection from the pool. The caller is responsible of release
     * the connection.
     * @param {Function} callback Receives an error and the connection as
     *    as parameters. Cannot be null.
     */
    getConnection: function (callback) {
      pool.getConnection(callback);
    },

    /** Closes all connections to the database aborting any operation in
     * progress.
     */
    close: function () {
      pool.end();
    }
  };
};
