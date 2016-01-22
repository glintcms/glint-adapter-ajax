/**
 * Module dependencies.
 */
var debug = require('debug')('glint-adapter-ajax');
var express = require('express');
var bodyParser = require('body-parser');
var bj = bodyParser.json({limit: '1gb'});
var path = require('path');
var merge = require('utils-merge');
var jsonify = require('json-fn');

var c = require('./config');
var cs = require('./config-server');

/**
 *  Module variables.
 */

/**
 * Initialize a new `AjaxAdapter` element.
 *
 * Caution when using options: options for the server side adapter go into the `server` field, those for the (ajax) part, must be provided via the `browser` field.
 */
function AjaxAdapter(options) {
  if (!(this instanceof AjaxAdapter)) return new AjaxAdapter(options);
  this.browser = {};
  merge(this.browser, c);
  this.server = {};
  merge(this.server, cs);
  merge(this, options);

  this.adapter = this.server.adapter(this.server);
  this.adapter.routes = this._initRoutes();
  this.adapter.provider = this.server.adapter.provider;
  this.adapter.ajax = this;
  return this.adapter;
}

/**
 * routes for API functions.
 */

AjaxAdapter.prototype.api = AjaxAdapter.api = 'adapter-provider';

AjaxAdapter.prototype.provider = AjaxAdapter.provider = 'ajax';

/**
 * @description: If you get something like this Error: POST http://... 413 (Request Entity Too Large) , make sure you have got the body-parser size set correctly.
 *
 * To Avoid 413 Errors with big json:  Error: POST http://localhost:8080/ajax/:db/:type/:id 413 (Request Entity Too Large),
 * you can use the following line:
 *
 * router.use(bodyParser.json({limit: '1gb'}));
 *
 */
AjaxAdapter.prototype._initRoutes = function() {
  var router = this.router = express.Router();

  var adapter = this.adapter;
  var path = this.browser.path;

  // find
  router.post(path + '/:db/:type/' + c.find, bj, function(req, res) {
    var db = req.params.db;
    var type = req.params.type;
    var queryString = req.body;
    var query = jsonify.parse(queryString);

    debug('AjaxAdapter find', db, type, query);
    adapter.find(db, type, query, function(err, data) {
      if (err) return res.status(404).json({error: err});
      res.send(data);
    });
  });

  // load
  router.get(path + '/:db/:type/:id', function(req, res) {
    var db = req.params.db;
    var type = req.params.type;
    var id = req.params.id;

    debug('AjaxAdapter load', db, type, id);
    adapter.load(db, type, id, function(err, data) {
      if (err) return res.status(404).json({error: err});
      res.send(data);
    });
  });

  // save
  router.post(path + '/:db/:type/:id', bj, function(req, res) {
    var db = req.params.db;
    var type = req.params.type;
    var id = req.params.id;
    var content = req.body;

    debug('AjaxAdapter save', db, type, id, content);
    adapter.save(db, type, id, content, function(err, data) {
      if (err) return res.status(404).json({error: err});
      res.send(data);
    });
  });

  // delete
  router.delete(path + '/:db/:type/:id', function(req, res) {
    var db = req.params.db;
    var type = req.params.type;
    var id = req.params.id;

    debug('AjaxAdapter delete', db, type, id);
    adapter.delete(db, type, id, function(err, success) {
      if (err) return res.status(404).json({error: err});
      res.send(success);
    });
  });

  return router;
};

/**
 * Helper functions.
 */
AjaxAdapter.prototype.getPath = function(db, type, id) {
  debug('ajax getPath', db, type, id);
  db = db || '';

  var p = [this.address, this.path, db, type, id];
  p = p.map(function(val) {
    return val.toLowerCase();
  });
  p = p.join('/');
  return p;
};

/**
 * Expose AjaxAdapter.
 */
exports = module.exports = AjaxAdapter;


/**
 *  usage with express:
 *  use('*', AjaxAdapter().routes)
 */

