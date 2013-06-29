var Query = require('db-query');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var definitions = require('./definitions');

var Seeder = function Seeder(pool, table, definition) {
  this.pool = pool;
  this.table = table;
  this.definition = definition;

  if (typeof this.definition.seed === 'function') {
    this.next = function () {
      return this.definition.seed();
    }.bind(this);
  } else if (Array.isArray(this.definition.seed)) {
    this.next = function () {
      return this.definition.seed.shift();
    }.bind(this);
  } else {
    throw 'Unknown seed : ' + util.inspect(this.definition);
  }
  EventEmitter.call(this);
};

util.inherits(Seeder, EventEmitter);

var p = Seeder.prototype;

p.execute = function () {
  this.insert(this.next());
};

// Insert given hash into the database
p.insert = function insert(seed) {
  if (!seed) {
    this.emit('end');
    return;
  }

  var q = new Query(this.pool);
  var sql = 'INSERT INTO ' + this.table + ' (' + Object.keys(seed).join(', ') + ') VALUES (';

  var params = [];
  Object.keys(seed).forEach(function (key) {
    q.param(typeof seed[key] === 'function' ? seed[key]() : (typeof definitions[seed[key]] === 'function' ? definitions[seed[key]]() : seed[key]));
    params.push(q.paramNo());
  });
  sql += params.join(', ') + ');';

  q.raw(sql);

  q.on('error', function (err) { console.log(err); this.emit('error', err); }.bind(this))
    .on('end', function () {
      this.insert(this.next());
    }.bind(this));

  q.execute();

  return this;
};

module.exports = Seeder;