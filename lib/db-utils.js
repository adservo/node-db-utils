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
var grunt = require('grunt');

var DBUtils = function DBUtils(pool) {
  this.pool = pool;
  this.pending = [];
  EventEmitter.call(this);
};

util.inherits(DBUtils, EventEmitter);

var p = DBUtils.prototype;

p.createSchemas = function loadSchemas(glob, seed) {
  var data;
  grunt.file.setBase(process.cwd());

  if (grunt.file.isDir(glob)) {
    glob = path.join(glob, '**');
  }
  var files = grunt.file.glob.sync(glob);
  if (!files.length) {
    throw 'Glob matches none : ' + glob;
  }
  files.forEach(function (file) {
    if (grunt.file.isDir(file)) {
      return;
    }
    console.log('Creating : ' + file);
    var table = path.basename(file, '.js');
    this.createSchema(table, require(path.join(process.cwd(), path.dirname(file), table)).schema);
    if (seed) {
      this.seedData(table, require(path.join(process.cwd(), path.dirname(file), table)).seed);
    }
  }.bind(this));
  this.end();
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

  var q = new Query(this.pool)
    .raw(sql)
    .on('error', function (err) { this.end(err); }.bind(this))
    .on('end', function (data) { this.end(null, data); }.bind(this));

  this.pending.push(q);
  console.log(q.query());
  return this;
};

p.seedData = function seedData(table, seed) {
  seed.forEach(function (data, index) {
    this.insertRow(table, data);
  }.bind(this));

  return this;
};

// Run CREATE TABLE command for given table name and schema definition
p.insertRow = function seedTable(table, seed) {
  var sql = 'INSERT INTO ' + table + ' (' + Object.keys(seed).join(', ') + ') VALUES (';
  var q = new Query(this.pool);

  var params = [];
  Object.keys(seed).forEach(function (key) {
    q.param(typeof seed[key] === 'function' ? seed[key]() : (typeof definitions[seed[key]] === 'function' ? definitions[seed[key]]() : seed[key]));
    params.push(q.paramNo());
  });
  sql += params.join(', ') + ');';
  q.raw(sql);

  q.on('error', function (err) { this.end(err); }.bind(this))
    .on('end', function (data) { this.end(null, data); }.bind(this));

  console.log(q.query());
  this.pending.push(q);

  return this;
};

p.end = function end(err, data) {
  if (err) {
    console.log(err);
  }
  var q = this.pending.shift();
  if (q) {
    this.emit('next');
    q.execute();
  } else {
    this.emit('end');
  }
};

module.exports = DBUtils;
