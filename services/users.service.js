"use strict";
const bcrypt = require('bcrypt');
const hat = require('hat');
const DBMixin = require('../mixins/db.mixin');
const AuthenticationMixin = require('../mixins/authentication.mixin');
const User = require('../models/user');

module.exports = {
  name: "users",
  mixins: [DBMixin("users"), AuthenticationMixin],
  model: User,

  settings: {
    fields: ['_id', 'email', 'firstName', 'lastName', 'bio'],
    entityValidator: {
      email: { type: "email" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      password: { type: "string" },
      bio: { type: "string", optional: true }
    }
  },

  actions: {
    count: false,
    remove: false,
    insert: false,
    find: false,

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
        }
      },
      async handler(ctx) {
        const user = new User(ctx.params.user);
        await this.validateEntity(user);
        user.password = bcrypt.hashSync(user.password, 10);
        user.apiKeys.push({
          token: hat(256),
          deviceId: hat() // TODO: use as a client param
        });
        try {
          await user.save();
        } catch (error) {
          // TODO: handle mongo errors
          console.error(error);
        }
        // TODO: implement proper serialization
        delete user.password;
        return user;
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
        return this.transformDocuments(ctx, {}, ctx.meta.currentUser);
      }
    }

  },

  methods: {

  }
};
