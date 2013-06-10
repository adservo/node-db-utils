'use strict';

var DBUtils = require('./lib/db-utils.js');

var dbPool = require('db-pool');

var devPool = dbPool.pool('postgres.development');

function end() {
  dbPool.closeAll();
}

function seedData() {
  var dbUtils = new DBUtils(devPool)
    .on('end', function () { console.log('Data seeded'); end(); })
    .seedData('db');
}

function createSchema() {
  var dbUtils = new DBUtils(devPool)
    .on('end', function () { console.log('Schema created'); seedData(); })
    .createSchemas('db');
}

var Faker = require('Faker');
console.log(Faker.Lorem.paragraphs(5));

createSchema();
