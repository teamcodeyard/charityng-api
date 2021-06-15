"use strict";
const bcrypt = require('bcrypt');
const hat = require('hat');
const DBMixin = require('../mixins/db.mixin');
const AuthenticationMixin = require('../mixins/authentication.mixin');
const User = require('../models/user');
const { ValidationError } = require('moleculer').Errors;
const { BadRequestError } = require('moleculer-web').Errors;

module.exports = {
  name: "users",
  mixins: [DBMixin("users"), AuthenticationMixin],
  model: User,

  settings: {
    fields: ['_id', 'email', 'firstName', 'lastName', 'bio', 'profileImageUrl'],
    entityValidator: {
      email: { type: "email" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      password: { type: "string" },
      bio: { type: "string", optional: true }
    },
    forgottenPasswordTokenValidityInMinutes: process.env.FORGOTTEN_PASSWORD_TOKEN_VALIDITY_IN_MINUTES || 15
  },

  actions: {
    count: false,
    remove: false,
    insert: false,
    find: false,
    get: false,
    list: false,
    update: false,

    /**
     * Registrate user with given params
     * @actions
     * @param {Object} user - User params
     * @returns {Object} - Saved and authenticated user with apiKeys
     */
    create: {
      auth: false,
      params: {
        user: {
          type: "object"
        },
        deviceId: {
          type: "string"
        }
      },
      async handler(ctx) {
        const user = new User(ctx.params.user);
        await this.validateEntity(user);
        user.email = user.email.replace(/\.(?=.*?@)|(\+[^\@]+)/g, '');
        user.password = bcrypt.hashSync(user.password, 10);
        user.apiKeys.push({
          token: hat(256),
          deviceId: ctx.params.deviceId
        });
        try {
          await user.save();
        } catch (error) {
          // TODO: handle mongo errors
          console.error(error);
        }
        this.clearCache();
        const response = await this.transformDocuments(ctx, {}, user);
        response.apiKeys = user.apiKeys
        return response;
      }
    },

    /**
     * Get current user for apiKey
     * @actions
     * @returns - Logged in user profile
     */
    me: {
      rest: "GET /me",
      async handler(ctx) {
        return this.transformDocuments(ctx, {}, ctx.meta.user);
      }
    },

    /**
     * Upload image for user profile
     * @actions
     * @returns - Updated user profile with new profile image url
     */
    uploadProfileImage: {
      rest: "POST /me/uploadProfileImage",
      hasFile: true,
      async handler(ctx) {
        if (!ctx.meta.files || ctx.meta.files.length == 0) {
          throw new ValidationError("MISSING FILE", 422, "MISSING FILE");
        }
        const file = ctx.meta.files[0];
        const updatedProfile = await this.adapter.updateById(ctx.meta.user._id, {
          $set: {
            profileImageUrl: file.url,
          }
        });
        this.clearCache();
        return this.transformDocuments(ctx, {}, updatedProfile);
      }
    },

    /**
    * Update own profile
    * @actions
    * @params {Object} user - optional properties of the user object
    * @returns - Updated user profile
    */
    update: {
      rest: {
        method: "PUT",
        path: "/me"
      },
      params: {
        user: {
          type: "object",
          props: {
            email: {
              type: "email",
              optional: true,
            },
            firstName: {
              type: "string",
              optional: true
            },
            lastName: {
              type: "string",
              optional: true
            },
            password: {
              type: "string",
              optional: true
            },
            bio: {
              type: "string",
              optional: true
            }
          }
        }
      },
      async handler(ctx) {
        const { user } = ctx.params;
        if (user.password) {
          user.password = bcrypt.hashSync(user.password, 10);
        }
        const updatedUser = await this.adapter.updateById(ctx.meta.user.id, {
          $set: user,
        });
        this.clearCache();
        return this.transformDocuments(ctx, {}, updatedUser);
      }
    },

    requestForgottenPassword: {
      auth: false,
      params: {
        email: {
          type: "email"
        }
      },
      async handler(ctx) {
        const user = await this.adapter.findOne({ email: ctx.params.email });
        if (user) {
          const token = hat(512);
          user.forgottenPasswordTokens.push({
            token
          });
          await user.save();
          // TODO: i18n
          await ctx.call('emails.sendEmail', { subject: "Forgotten password", receivers: [user.email], templateName: "forgottenPassword", locale: "en", variables: { token } })
        }
        return { response: "ok" }
      }
    },

    changeForgottenPassword: {
      auth: false,
      params: {
        token: {
          type: "string"
        },
        password: {
          type: "string"
        }
      },
      async handler(ctx) {
        const user = await this.adapter.findOne({ forgottenPasswordTokens: { $elemMatch: { token: ctx.params.token } } })
        if (!user) {
          throw new BadRequestError(); // TODO: handle errors
        }
        const token = user.forgottenPasswordTokens.find(x => x.token === ctx.params.token);
        const diffInMs = new Date() - token.createdAt;
        const diffInMinutes = Math.round(((diffInMs % 86400000) % 3600000) / 60000);
        if (diffInMinutes > this.settings.forgottenPasswordTokenValidityInMinutes) {
          await this.adapter.updateById(user._id, { $pull: { forgottenPasswordTokens: { _id: token._id } } });
          throw new BadRequestError(); // TODO: handle errors
        }
        const password = bcrypt.hashSync(ctx.params.password, 10);
        await this.adapter.updateById(user._id, {
          $set: {
            password
          },
          $pull: {
            forgottenPasswordTokens: {
              _id: token._id
            }
          }
        });
        return { response: "ok" }
      }
    }

  },

  methods: {
    clearCache() {
      if (this.broker.cacher) {
        this.broker.cacher.clean('users.**');
        this.broker.broadcast("cache.clean.users");
      }
    }
  }
};
