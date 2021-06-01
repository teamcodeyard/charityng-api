const bcrypt = require('bcrypt');
const hat = require('hat');
const { NotFoundError, UnAuthorizedError } = require("moleculer-web").Errors;

module.exports = {
  actions: {
    /**
     * Find user by api key
     * @actions
     * @param {String} apiKey - Token of the existing api key
     * @returns {Object} - Authenticated user
     */
    findByApiKey: {
      params: {
        apiKey: {
          type: "string"
        }
      },
      async handler(ctx) {
        const user = await this.adapter.findOne({
          apiKeys: {
            $elemMatch: {
              token: ctx.params.apiKey,
            }
          }
        });
        return user;
      }
    },

    /**
    * TODO: write comments
    */
    login: {
      auth: false,
      params: {
        email: {
          type: "email"
        },
        password: {
          type: "string"
        },
        deviceId: {
          type: "string",
        }
      },
      async handler(ctx) {
        const { email, password } = ctx.params;
        const user = await this.adapter.findOne({ email });
        if (!user) {
          throw new NotFoundError() // TODO: use proper errors
        }
        const passwordMatched = await bcrypt.compare(password, user.password);
        if (!passwordMatched) {
          throw new UnAuthorizedError(); // TODO: use proper errors
        }
        const apiKey = {
          token: hat(256),
          deviceId: ctx.params.deviceId
        };
        user.apiKeys.push(apiKey);
        await user.save();
        const response = await this.transformDocuments(ctx, {}, user);
        return { ...response, apiKeys: [apiKey] }
      }
    }
  }
}