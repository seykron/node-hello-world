/** Represents a test item to display something in the frontend. It adapts the
 * model from a foreign data source (i.e: MySQL or a REST service).
 *
 * @param {Object} item Raw item object, usually retieved from some kind of
 *    data source. Cannot be null.
 * @constructor
 */
module.exports = function Item(item) {

  return {
    id: item.id,
    name: item.name,
    pictureUrl: item.picture_url,
    siteUrl: item.site_url
  };
};
