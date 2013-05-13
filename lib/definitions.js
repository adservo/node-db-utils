var Faker = require('Faker');

module.exports = {
  DOMAIN:           Faker.Internet.domainName,
  EMAIL:            Faker.Internet.email,

  FIRST_NAME:       Faker.Name.firstName,
  LAST_NAME:        Faker.Name.lastName,
  FULL_NAME:        Faker.Name.findName,

  STREET_NAME:      Faker.Address.streetName,
  STREET_ADDRESS:   Faker.Address.streetName,
  CITY:             Faker.Address.city,
  COUNTY:           Faker.Address.ukCounty,
  STATE:            Faker.Address.usState,
  COUNTRY:          Faker.Address.ukCountry,

  SENTENCE:         Faker.Lorem.sentence,
  SENTENCES:        Faker.Lorem.sentences,
  PARAGRAPH:        Faker.Lorem.Paragraph,
  PARAGRAPHS:       Faker.Lorem.Paragraphs

};
