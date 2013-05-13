/*
 * db-utils
 * https://github.com/mark/node-db-utils
 *
 * Copyright (c) 2013 Mark Selby
 * Licensed under the MIT license.
 */

'use strict';

var Query = require('db-query');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require("fs");
var path = require('path');
var definitions = require('./definitions');
var rootDir = process.cwd();

var DBUtils = function DBUtils(pool) {
  EventEmitter.call(this);
  this.pool = pool;
};

util.inherits(DBUtils, EventEmitter);

var p = DBUtils.prototype;

p.createSchemas = function loadSchemas(dir) {
  try {
    if (!fs.statSync(dir).isDirectory()) { return; }
  } catch (e) {
    return;
  }
  var data;
  var files = fs.readdirSync(dir);
  files.forEach(function (file) {
    var fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      this.createSchemas(fullPath);
    } else {
      data = require(path.join(rootDir, dir, file.split('.')[0]));
      this.createSchema(path.basename(file, '.js'), data.schema);
    }
  }.bind(this));
};

p.createSchema = function createTable(table, schema) {
  var sql = 'CREATE TABLE ' + table + ' (';
  var fields = [];
  Object.keys(schema).forEach(function (key) {
    fields.push([key, schema[key]].join(' '));
  });
  sql += fields.join(', ');
  sql += ');';

  var q = new Query(this.pool)
    .raw(sql)
    .on('error', function (err) { console.log(err); })
    .on('end', function (data) { console.log(data); });

  console.log(q.query());
  q.execute();
};

module.exports = DBUtils;
