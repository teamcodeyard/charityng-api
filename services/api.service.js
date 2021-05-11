"use strict";

const ApiGateway = require("moleculer-web");
const formidable = require('formidable');

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 * @typedef {import('http').IncomingMessage} IncomingRequest Incoming HTTP Request
 * @typedef {import('http').ServerResponse} ServerResponse HTTP Server Response
 */

module.exports = {
  name: "api",
  mixins: [ApiGateway],

  // More info about settings: https://moleculer.services/docs/0.14/moleculer-web.html
  settings: {
    // Exposed port
    port: process.env.PORT || 3000,

    // Exposed IP
    ip: "0.0.0.0",

    // Global Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
    use: [],

    routes: [
      {
        path: "/api",
        isAdmin: false,
        whitelist: [
          // Users
          "users.create",
          "users.me",
          "users.uploadProfileImage",

          // Campaigns
          "campaigns.createFulfillment"
        ],

        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],

        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: true,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: false,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        aliases: {

        },

        /** 
         * Before call hook. You can check the request.
         * @param {Context} ctx 
         * @param {Object} route 
         * @param {IncomingRequest} req 
         * @param {ServerResponse} res 
         * @param {Object} data
         */
        async onBeforeCall(ctx, route, req, res) {
          if (req.$action.hasFile === true) {
            await this.handleFileUpload(ctx, req);
          }
        },

        /**
         * After call hook. You can modify the data.
         * @param {Context} ctx 
         * @param {Object} route 
         * @param {IncomingRequest} req 
         * @param {ServerResponse} res 
         * @param {Object} data
        onAfterCall(ctx, route, req, res, data) {
          // Async function which return with Promise
          return doSomething(ctx, res, data);
        }, */

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB"
          },
          urlencoded: {
            extended: true,
            limit: "1MB"
          }
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: "all", // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true
      },
      {
        path: "/admin",
        isAdmin: true,
        whitelist: [
          ""
        ],

        // Route-level Express middlewares. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Middlewares
        use: [],

        // Enable/disable parameter merging method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Disable-merging
        mergeParams: true,

        // Enable authentication. Implement the logic into `authenticate` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authentication
        authentication: true,

        // Enable authorization. Implement the logic into `authorize` method. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Authorization
        authorization: false,

        // The auto-alias feature allows you to declare your route alias directly in your services.
        // The gateway will dynamically build the full routes from service schema.
        autoAliases: true,

        aliases: {

        },

        /** 
         * Before call hook. You can check the request.
         * @param {Context} ctx 
         * @param {Object} route 
         * @param {IncomingRequest} req 
         * @param {ServerResponse} res 
         * @param {Object} data
         * 
        onBeforeCall(ctx, route, req, res) {
          // Set request headers to context meta
          ctx.meta.userAgent = req.headers["user-agent"];
        }, */

        /**
         * After call hook. You can modify the data.
         * @param {Context} ctx 
         * @param {Object} route 
         * @param {IncomingRequest} req 
         * @param {ServerResponse} res 
         * @param {Object} data
        onAfterCall(ctx, route, req, res, data) {
          // Async function which return with Promise
          return doSomething(ctx, res, data);
        }, */

        // Calling options. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Calling-options
        callingOptions: {},

        bodyParsers: {
          json: {
            strict: false,
            limit: "1MB"
          },
          urlencoded: {
            extended: true,
            limit: "1MB"
          }
        },

        // Mapping policy setting. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Mapping-policy
        mappingPolicy: "all", // Available values: "all", "restrict"

        // Enable/disable logging
        logging: true
      }
    ],

    // Do not log client side errors (does not log an error response when the error.code is 400<=X<500)
    log4XXResponses: false,
    // Logging the request parameters. Set to any log level to enable it. E.g. "info"
    logRequestParams: null,
    // Logging the response data. Set to any log level to enable it. E.g. "info"
    logResponseData: null,


    // Serve assets from "public" folder. More info: https://moleculer.services/docs/0.14/moleculer-web.html#Serve-static-files
    assets: {
      folder: "public",

      // Options to `server-static` module
      options: {}
    }
  },

  methods: {

    /**
     * 
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    async authenticate(ctx, route, req) {
      // Read the token from header
      const apiKey = req.headers["api-key"];
      if (req.$action.auth === false) {
        return null;
      }
      let authenticateAction = 'users.findByApiKey';
      if (route.opts.isAdmin) {
        authenticateAction = 'admin.users.findByApiKey'
      }
      if (apiKey) {
        const user = await ctx.call(authenticateAction, { apiKey })
        if (user) {
          return user;
        } else {
          // Invalid token
          throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN);
        }
      } else {
        // No token. Throw an error or do nothing if anonymous access is allowed.
        // throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
        throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_NO_TOKEN);
      }
    },

    /**
     * Authorize the request. Check that the authenticated user has right to access the resource.
     *
     * PLEASE NOTE, IT'S JUST AN EXAMPLE IMPLEMENTATION. DO NOT USE IN PRODUCTION!
     *
     * @param {Context} ctx
     * @param {Object} route
     * @param {IncomingRequest} req
     * @returns {Promise}
     */
    async authorize(ctx, route, req) {
      // Get the authenticated user.
      const user = ctx.meta.user;

      // It check the `auth` property in action schema.
      if (req.$action.auth == "required" && !user) {
        throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS");
      }
    },

    async handleFileUpload(ctx, req) {
      const promisifyUpload = (req) => new Promise((resolve, reject) => {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          if (files != null && files.file) {
            ctx.meta.files = [files.file];
          }
          return resolve(ctx.meta.files);
        });
      })
      await promisifyUpload(req);
    }

  }
};
