var Faker = require('Faker');

exports.schema = {
  id:             "serial PRIMARY KEY",
  first_name:     "varchar(40) NOT NULL",
  last_name:      "varchar(40) NOT NULL",
  date_of_birth:  "date",
  gender:         "varchar(1)",
  introduction:   "varchar(255)",
  description:    "text",
  created:        "timestamp DEFAULT current_timestamp",
  updated:        "timestamp DEFAULT current_timestamp"
};

exports.seed = {
  first_name:     'FIRST_NAME',
  last_name:      'LAST_NAME',
  gender:         function () { return ['M', 'F', 'O'][Math.floor(Math.random() * 3)]; },
  introduction:   function () { return Faker.Lorem.sentence(); },
  description:    function () { return Faker.Lorem.paragraphs(5); }
};
