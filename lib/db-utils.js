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
var Seeder = require('./seeder');
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
  // Whether to seed or not
  this.seed = seed;
  this.files = [];
  var data;

  if (grunt.file.isDir(glob)) {
    glob = path.join(glob, '**');
  }

  grunt.file.glob.sync(glob).forEach(function (file) {
    if (grunt.file.isFile(file)) {
      this.files.push(file);
    }
  }, this);

  if (!this.files.length) {
    throw 'Glob matches none : ' + glob;
  }

  this.processNextFile();
  return this;
};

p.processNextFile = function () {
  var file = this.files.shift();
  if (!file) {
    this.emit('end');
    return;
  }

  var basename = path.basename(file, '.js');
  var requirePath = path.join(process.cwd(), path.dirname(file), basename);
  var definition = require(requirePath);
  var table = definition.table || basename;
  this.createSchema(definition, table);
};

// Run CREATE TABLE command for given table name and schema definition
p.createSchema = function createTable(definition, table) {
  var sql = 'CREATE TABLE IF NOT EXISTS ' + table + ' (';
  var fields = [];
  Object.keys(definition.schema).forEach(function (key) {
    fields.push([key, definition.schema[key]].join(' '));
  });
  sql += fields.join(', ') + ');';

  var q = new Query(this.pool)
    .raw(sql)
    .on('error', function (err) { throw err; }.bind(this))
    .on('end', function (data) {
      console.log('Create ended');
      this.seedData(definition, table);
    }.bind(this));

  q.execute();
  return this;
};

p.seedData = function seedData(definition, table) {
  if (this.seed && definition.seed) {
    new Seeder(this.pool, table, definition)
      .on('end', function () {
        this.processNextFile();
      }.bind(this))
      .execute();
    return;
  } else {
    this.processNextFile();
  }
  return this;
};

module.exports = DBUtils;
