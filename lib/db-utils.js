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
  this.pool = pool;
  this.pending = 0;
  EventEmitter.call(this);
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
  return this;
};

// Run CREATE TABLE command for given table name and schema definition
p.createSchema = function createTable(table, schema) {
  var sql = 'CREATE TABLE IF NOT EXISTS ' + table + ' (';
  var fields = [];
  Object.keys(schema).forEach(function (key) {
    fields.push([key, schema[key]].join(' '));
  });
  sql += fields.join(', ') + ');';

  this.pending++;
  var q = new Query(this.pool)
    .raw(sql)
    .on('error', function (err) { this.end(err); }.bind(this))
    .on('end', function (data) { this.end(null, data); }.bind(this));
  q.execute();

  return this;
};

p.seedData = function seedData(dir) {
  try {
    if (!fs.statSync(dir).isDirectory()) { return; }
  } catch (e) {
    return;
  }
  var i, data;
  var files = fs.readdirSync(dir);
  files.forEach(function (file) {
    var fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      this.seedData(fullPath);
    } else {
      data = require(path.join(rootDir, dir, file.split('.')[0]));
      for (i = 0; i < 10; i++) {
        this.seedTable(path.basename(file, '.js'), data.seed);
      }
    }
  }.bind(this));
  return this;
};

// Run CREATE TABLE command for given table name and schema definition
p.seedTable = function seedTable(table, seed) {
  var sql = 'INSERT INTO ' + table + ' (' + Object.keys(seed).join(', ') + ') VALUES (';
  var q = new Query(this.pool);

  var params = [];
  Object.keys(seed).forEach(function (key) {
    q.param(typeof seed[key] === 'function' ? seed[key]() : definitions[seed[key]]());
    params.push(q.paramNo());
  });
  sql += params.join(', ') + ');';
  q.raw(sql);

  this.pending++;
  q.on('error', function (err) { this.end(err); }.bind(this))
    .on('end', function (data) { this.end(null, data); }.bind(this));

  console.log(q.query());
  q.execute();

  return this;
};

p.end = function end(err, data) {
  if (err) { console.log(err); }
  if (--this.pending) {
    this.emit('next');
  } else {
    this.emit('end');
  }
};

module.exports = DBUtils;
