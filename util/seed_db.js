const FriendsBdays = require("../models/FriendsBdays");
const User = require("../models/User");
const faker = require("@faker-js/faker").fakerEN_US;
require("dotenv").config();

const testUserPassword = faker.internet.password();

const buildFriendBday = (overrides = {}) => ({
  firstName: faker.string.alpha({ length: { min: 3, max: 10 } }),
  lastName: faker.string.alpha({ length: { min: 3, max: 12 } }),
  birthdayMonth:
    [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ][Math.floor(12 * Math.random())],
  birthdayDay: Math.floor(28 * Math.random()) + 1,
  ...overrides,
});

const buildUser = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
  ...overrides,
});

const factory = {
  build: async (type, overrides = {}) => {
    if (type === "user") {
      return buildUser(overrides);
    }

    if (type === "friendBday") {
      return buildFriendBday(overrides);
    }

    throw new Error(`Unknown factory type: ${type}`);
  },

  create: async (type, overrides = {}) => {
    if (type === "user") {
      return User.create(buildUser(overrides));
    }

    if (type === "friendBday") {
      return FriendsBdays.create(buildFriendBday(overrides));
    }

    throw new Error(`Unknown factory type: ${type}`);
  },

  createMany: async (type, count, overrides = {}) => {
    const rows = [];

    for (let i = 0; i < count; i += 1) {
      rows.push(await factory.create(type, overrides));
    }

    return rows;
  },
};

const seed_db = async () => {
  let testUser = null;
  try {
    await FriendsBdays.deleteMany({});
    await User.deleteMany({});
    testUser = await factory.create("user", { password: testUserPassword });
    await factory.createMany("friendBday", 20, { createdBy: testUser._id });
  } catch (e) {
    console.log("database error");
    console.log(e.message);
    throw e;
  }
  return testUser;
};

module.exports = { testUserPassword, factory, seed_db };