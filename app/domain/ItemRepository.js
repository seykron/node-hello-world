/** Example repository to manage <code>Item</code>s.
 *
 * @param {Object} context Global application context. Cannot be null.
 * @param {Object} conn Open connection to the data source. Cannot be null.
 * @constructor
 */
module.exports = function ItemsRepository(context, conn) {

  /** List all items. */
  var LIST_ALL = "select * from items";

  return {

    /** Lists all items.
     *
     * @param {Function} callback Receives an error and the list of items
     *    as parameters. Cannot be null.
     */
    list: function (callback) {
      conn.query(LIST_ALL, function (err, rows) {
        if (err) {
          return callback(err);
        }
        callback(null, rows.map(function (row) {
          return new context.domain.Item(row);
        }));
      });
    }
  };
};
