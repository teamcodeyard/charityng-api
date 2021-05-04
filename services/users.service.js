"use strict";
const bcrypt = require('bcrypt');
const hat = require('hat');
const DBMixin = require('../mixins/db.mixin');
const AWSMixin = require('../mixins/aws.mixin');
const AuthenticationMixin = require('../mixins/authentication.mixin');
const User = require('../models/user');
const { ValidationError } = require('moleculer').Errors;

module.exports = {
  name: "users",
  mixins: [DBMixin("users"), AuthenticationMixin, AWSMixin],
  model: User,

  settings: {
    fields: ['_id', 'email', 'firstName', 'lastName', 'bio', 'profileImageUrl'],
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
        },
        deviceId: {
          type: "string"
        }
      },
      async handler(ctx) {
        const user = new User(ctx.params.user);
        await this.validateEntity(user);
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
        const path = `/users/${ctx.meta.user._id}/profileImages/${hat()}/`;
        const file = ctx.meta.files[0];
        const awsResponse = await this.uploadFile(path + file.name, file);
        const updatedProfile = await this.adapter.updateById(ctx.meta.user._id, {
          $set: {
            profileImageUrl: awsResponse.Location,
          }
        });
        return this.transformDocuments(ctx, {}, updatedProfile);
      }
    }

  },

  methods: {

  }
};
