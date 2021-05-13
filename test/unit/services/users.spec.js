"use strict";

process.env.TEST = true;

const { ServiceBroker, Context } = require("moleculer");
const TestService = require("../../../services/users.service");
const mockingoose = require('mockingoose');
const { ObjectId } = require("mongodb");
const model = require('../../../models/user');

const validUser = {
  email: "test@codeyard.eu",
  firstName: "Test",
  lastName: "User",
  password: "letmeinpls",
  bio: "Hello world!"
};

describe("Test 'users' service", () => {
  const broker = new ServiceBroker({ logger: false });
  const ctx = Context.create(broker, null, {});
  ctx.meta.user = validUser;
  const service = broker.createService(TestService);

  jest.spyOn(service, "transformDocuments");
  jest.spyOn(service, "validateEntity");

  mockingoose(model).toReturn({}, 'insertOne');

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());
  beforeEach(() => {
    service.validateEntity.mockClear();
    service.transformDocuments.mockClear();
  });

  describe("Test 'users.create' action", () => {
    it("should register a new user", async () => {
      const response = await ctx.call('users.create', {
        user: validUser,
        deviceId: "1432",
      });
      expect(response.apiKeys).not.toBeNull();
      expect(response.password).toBeUndefined();
      expect(service.transformDocuments).toBeCalledTimes(1);
      expect(service.validateEntity).toBeCalledTimes(1);
      expect(service.transformDocuments).toBeCalledWith(expect.any(Context), {}, expect.objectContaining({ email: validUser.email }));
    });

    it("should transform email alias", async () => {
      const aliasUser = { ...validUser, email: 't.est+1432@gmail.com' };
      const response = await ctx.call('users.create', {
        user: aliasUser,
        deviceId: "2341",
      });
      expect(service.validateEntity).toBeCalledTimes(1);
      expect(service.transformDocuments).toBeCalledWith(expect.any(Context), {}, expect.objectContaining({ email: "test@gmail.com" }));
    });

    it("should fail without deviceId", async () => {
      try {
        await ctx.call('users.create', {
          user: validUser,
        });
      } catch (err) {
        expect(err.code).toBe(422);
        expect(err.type).toBe('VALIDATION_ERROR');
      }
    });

    it("should fail with invalid email", async () => {
      const invalidUser = { ...validUser, email: 'dummy@codeyard' };
      try {
        await ctx.call('users.create', {
          user: invalidUser,
          deviceId: '1432'
        });
      } catch (err) {
        expect(err.code).toBe(422);
        expect(err.type).toBe('VALIDATION_ERROR');
      }
    });

    it("should fail with invalid email", async () => {
      const invalidUser = { ...validUser, email: 'dummy@codeyard' };
      try {
        await ctx.call('users.create', {
          user: invalidUser,
          deviceId: '1432'
        });
      } catch (err) {
        expect(err.code).toBe(422);
        expect(err.type).toBe('VALIDATION_ERROR');
      }
    });

  });
  describe("Test 'users.me' action", () => {
    it("should get own profile", async () => {
      const response = await ctx.call('users.me');
      expect(response.email).toBe('test@codeyard.eu');
      expect(response.apiKeys).toBeUndefined();
      expect(response.password).toBeUndefined();
    });
  });
});