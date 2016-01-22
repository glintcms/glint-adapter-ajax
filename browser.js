/**
 * Module dependencies.
 */
var debug = require('debug')('glint-adapter-ajax');
var merge = require('utils-merge');
var request = require('superagent');
var jsonify = require('json-fn');

var c = require('./config');

/**
 * superagent `callback(err, fn)` signature consistency fix for browser
 * @link https://github.com/visionmedia/superagent/issues/19
 */

var Request = request.Request;
Request.prototype.endWithoutErr = Request.prototype.end;
Request.prototype.end = function (fn) {
  this.endWithoutErr(function (res) {
    if (fn.length < 2) return fn(res);
    if (res.ok) {
      fn(null, res);
    } else {
      fn(res.text);
    }
  });
};

/**
 * Initialize a new `AjaxAdapter` element.
 */
function AjaxAdapter(options) {
  if (!(this instanceof AjaxAdapter)) return new AjaxAdapter(options);
  this.browser = {};
  merge(this.browser, c);
  merge(this, options);
  this.address = removeSlash(this.browser.address || location.origin);
  this.path = removeSlash(this.browser.path);
}

/**
 * API functions.
 */

AjaxAdapter.prototype.api = AjaxAdapter.api = 'adapter-provider';

AjaxAdapter.prototype.provider = AjaxAdapter.provider = 'ajax';

AjaxAdapter.prototype.find = function (db, type, query, fn) {
  var queryString = jsonify.stringify(query);
  var path = this.getPath(db, type, c.find);
  debug('ajax load', path);
  request
    .post(path)
    //.withCredentials()
    .send(queryString)
    .set('Accept', 'application/json')
    //.set('Cookie', document.cookie)
    .end(function (err, res) {
      if (err) return fn(err);
      if (res && res.body && res.body) return fn(null, res.body);
      if (fn) return fn();
    });
};

AjaxAdapter.prototype.load = function (db, type, id, fn) {
  var path = this.getPath(db, type, id);
  debug('ajax load', path);
  request
    .get(path)
    //.withCredentials()
    .set('Accept', 'application/json')
    //.set('Cookie', document.cookie)
    .end(function (err, res) {
      if (err) return fn(err);
      if (res && res.body && res.body) return fn(null, res.body);
      if (fn) return fn();
    });
};

/**
 * @description: If you get something like this Error: POST http://... 413 (Request Entity Too Large) , make sure you have got the body-parser size set correctly.
 */
AjaxAdapter.prototype.save = function (db, type, id, content, fn) {
  var path = this.getPath(db, type, id);
  debug('ajax save', path);
  request
    .post(path)
    //.withCredentials()
    .send(content)
    .set('Accept', 'application/json')
    //.set('Cookie', document.cookie)
    .end(function (err, res) {
      if (err) return fn(err);
      if (res && res.body && res.body) return fn(null, res.body);
      if (fn) return fn();
    });
};


AjaxAdapter.prototype.delete = function (db, type, id, fn) {
  var path = this.getPath(db, type, id);
  debug('ajax delete', path);
  request
    .del(path)
    //.withCredentials()
    .set('Accept', 'application/json')
    //.set('Cookie', document.cookie)
    .end(function (err, res) {
      if (err) return fn(err);
      if (res && res.ok && res.ok == true) return fn(null, true);
      if (fn) return fn(null, false);
    });
};

/**
 * Helper functions.
 */
AjaxAdapter.prototype.getPath = function (db, type, id) {
  debug('ajax getPath', db, type, id);
  var path = [this.address, this.path, db, type, id];
  path = path.map(function (val) {
    return val.toLowerCase();
  });
  path = path.join('/');
  return path;
};

function removeSlash(str) {
  if (!str) return '';
  if (str.indexOf('/') == 0) str = str.substr(1);
  if (str.lastIndexOf('/') == (str.length - 1)) str = str.substr(0, str.length - 1);
  return str;
}

/**
 * Expose AjaxAdapter element.
 */
exports = module.exports = AjaxAdapter;
