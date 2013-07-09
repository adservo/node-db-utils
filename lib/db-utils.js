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

var util =    require('util');
var path =    require('path');
var grunt =   require('grunt');

var Seeder =  require('./seeder');
var Schema =  require('./schema');

var rootDir = process.cwd();

var DBUtils = function DBUtils(pool) {
  this.pool = pool;
  this.pending = 0;
  EventEmitter.call(this);
};

util.inherits(DBUtils, EventEmitter);

var p = DBUtils.prototype;

p.migrate = function migrate(glob, options) {
  // { create: true|false, seed: true:false }
  console.log('options : ' + util.inspect(options));
  this.options = options || { create: true, seed: true };
  this.files = [];
  this.tasks = [];
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

  this.emit('next');
  return this;
};

/**
 * Process the next seed definition file
 */
p.on('next', function next() {
  console.log('Migrate next event');
  var file = this.files.shift();
  if (!file) {
    console.log('Migrate complete');
    this.emit('end');
    return;
  }

  var basename = path.basename(file, '.js');
  var requirePath = path.join(process.cwd(), path.dirname(file), basename);
  console.log('Requiring : ' + requirePath);
  var definition = require(requirePath);
  var table = definition.table || basename;

  if (this.options.create) {
    this.create(table, definition);
  }
  if (this.options.seed) {
    this.seed(table, definition);
  }
  this.emit('task-done');
});

p.create = function create(table, definition) {
  if (definition.schema) {
    this.tasks.push(
      new Schema(this.pool, table, definition.schema)
        .on('end', function () {
          this.emit('task-done');
        }.bind(this))
    );
  }
};

p.seed = function seed(table, definition) {
  if (definition.seed) {
    this.tasks.push(
      new Seeder(this.pool, table, definition.seed)
        .on('end', function () {
          this.emit('task-done');
        }.bind(this))
    );
  }
};

p.on('task-done', function () {
  console.log('tasks : ' + this.tasks.length);
  var task = this.tasks.shift();
  if (!task) {
    this.emit('next');
    return;
  }
  task.execute();
});

module.exports = DBUtils;
