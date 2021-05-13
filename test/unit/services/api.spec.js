"use strict";

process.env.TEST = true;

const { ServiceBroker, Context } = require("moleculer");
const TestService = require("../../../services/api.service");

const validUser = {
  email: "test@codeyard.eu",
  firstName: "Test",
  lastName: "User",
  password: "letmeinpls",
  bio: "Hello world!"
};

describe("Test 'api' service", () => {
  const broker = new ServiceBroker({ logger: false });
  const ctx = Context.create(broker, null, {});
  ctx.meta.user = {};
  const service = broker.createService(TestService);

  const FakeUsersService = {
    name: 'users',
    actions: {
      findByApiKey: jest.fn((ctx) => {
        if(ctx.params.apiKey === 1432) {
          return validUser;
        }
        return undefined;
      }),
    }
  }
  broker.createService(FakeUsersService);
  
  jest.spyOn(ctx, "call");

  beforeAll(async () => await broker.start());
  afterAll(() => broker.stop());
  beforeEach(() => {
    ctx.call.mockClear();
  });

  describe("Test 'authenticate' method", () => {
    it("should authenticate user", async () => {
      const response = await service.authenticate(ctx, { opts: { isAdmin: false } }, { $action: { auth: true }, headers: { 'api-key': 1432 } });
      expect(response).toBe(validUser);
      expect(ctx.call).toBeCalledTimes(1);
    });
    
    it("should raise error without apiKey", async () => {
      try {
        const response = await service.authenticate(ctx, { opts: { isAdmin: false } }, { $action: { auth: true }, headers: { 'api-key': undefined } });
      } catch(err) {
        expect(err.code).toBe(401);
        expect(err.type).toBe('NO_TOKEN');
        expect(ctx.call).toBeCalledTimes(0);
      }
    });

    it("should skip authenticate", async () => {
      const response = await service.authenticate(ctx, { opts: { isAdmin: false } }, { $action: { auth: false }, headers: { 'api-key': undefined } });
      expect(response).toBeNull();
      expect(ctx.call).toBeCalledTimes(0);
    });
  });

});