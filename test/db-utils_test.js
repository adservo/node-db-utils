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
var dbPool = require('db-pool');
var testPool = dbPool.pool('test');

exports.awesome = {
  setUp: function (done) {
    new DBUtils(testPool)
      .on('end', function () { done(); })
      .createSchemas('db');
  },
  'no args': function (test) {
    // test.expect(1);
    // tests here
    test.equal('awesome', 'awesome', 'should be awesome.');
    test.done();
  },
  tearDown: function (done) {
    dbPool.close();
    done();
  }
};
