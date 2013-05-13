'use strict';

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

var DBUtils = require('../lib/db-utils.js');

// Set up database
var anyDB = require('any-db');
anyDB.adapters.postgres.forceJS = true;

var dbPool = anyDB.createPool('postgres://localhost:5432/test_db', {
  min: 5,
  max: 15,
  onConnect: function (conn, done) {
    done(null, conn);
  },
  reset: function (conn, done) {
    done(null);
  }
});

exports.awesome = {
  setUp: function (done) {
    var db = new DBUtils(dbPool);
    db.createSchemas('db', function() {
      // setup here
      done();
    });

  },
  'no args': function (test) {
    test.expect(1);
    // tests here
    // test.equal(db_utils.awesome(), 'awesome', 'should be awesome.');
    test.done();
  }
};
