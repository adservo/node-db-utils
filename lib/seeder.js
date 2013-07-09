var Query = require('db-query');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var definitions = require('./definitions');

var Seeder = function Seeder(client, table, definition) {
  this.client = client;
  this.table = table;
  this.definition = definition;

  // Simple pattern to avoid buffering up queries (we could be seeding thousands)
  this.client.on('drain', function() {
    this.emit('next');
  }.bind(this));

  EventEmitter.call(this);

  if (typeof this.definition === 'function') {
    this.next = p.seedFromFunction.bind(this);
    return;
  }
  if (Array.isArray(this.definition)) {
    this.next = p.seedFromArray.bind(this);
    return;
  }
  throw 'Unknown seed : ' + util.inspect(this.definition);
};

util.inherits(Seeder, EventEmitter);

var p = Seeder.prototype;

p.seedFromFunction = function () {
  return this.definition();
};

p.seedFromArray = function () {
  return this.definition.shift();
};

p.execute = function () {
  this.emit('next');
};

/**
 * Previous insert completed, check for more
 */
p.on('next', function() {
  var data = this.next();
  if (!data) {
    this.emit('end');
    return;
  }
  this.insert(data);
});

/**
 * Insert given hash into the database
 */
p.insert = function insert(seed) {
  var q = new Query(this.client);
  var sql = 'INSERT INTO ' + this.table + ' (' + Object.keys(seed).join(', ') + ') VALUES (';

  var params = [];
  Object.keys(seed).forEach(function (key) {
    q.param(typeof seed[key] === 'function' ? seed[key]() : (typeof definitions[seed[key]] === 'function' ? definitions[seed[key]]() : seed[key]));
    params.push(q.paramNo());
  });
  sql += params.join(', ') + ');';

  q.raw(sql);
  q.on('error', function (err) { console.log(err); this.emit('error', err); }.bind(this))
    // .on('end', function () {
    //   this.emit('next');
    // }.bind(this));
  q.execute();
};

module.exports = Seeder;
