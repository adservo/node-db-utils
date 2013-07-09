var Query = require('db-query');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var definitions = require('./definitions');

var Schema = function Schema(client, table, definition) {
  this.client = client;
  this.table = table;
  this.definition = definition;
  EventEmitter.call(this);
};

util.inherits(Schema, EventEmitter);

var p = Schema.prototype;

p.execute = function execute() {
  console.log('Creating schema : ' + this.table);
  var sql = 'DROP TABLE IF EXISTS ' + this.table + '; ';
  sql += 'CREATE TABLE IF NOT EXISTS ' + this.table + ' (';
  var fields = [];
  Object.keys(this.definition).forEach(function (key) {
    fields.push([key, this.definition[key]].join(' '));
  }.bind(this));
  sql += fields.join(', ') + ');';

  q = new Query(this.client)
    .raw(sql)
    .on('error', function (err) {
      this.emit('error', err);
    }.bind(this))
    .on('end', function () {
      this.emit('end');
    }.bind(this));
  q.execute();
}

module.exports = Schema;
