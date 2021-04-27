"use strict";
const bcrypt = require('bcrypt');
const hat = require('hat');
const DBMixin = require('../mixins/db.mixin');
const AdminUser = require('../models/adminUser');

module.exports = {
  name: "admin.users",
  mixins: [DBMixin("adminUsers")],
  model: AdminUser,

  settings: {
    entityValidator: {
      email: { type: "email" },
      firstName: { type: "string" },
      lastName: { type: "string" },
      password: { type: "string" },
    }
  },
  actions: {
    count: false,
    remove: false,
    insert: false,
    find: false,

    /**
     * TODO: write comments
     */
    create: {
      params: {
        adminUser: {
          type: "object"
        }
      },
      async handler(ctx) {
        const adminUser = new AdminUser(ctx.params.adminUser);
        await this.validateEntity(adminUser);
        adminUser.password = bcrypt.hashSync(adminUser.password, 10);
        adminUser.apiKeys.push({
          token: hat(256),
          deviceId: hat() // TODO: use as a client param
        });
        try {
          await adminUser.save();
        } catch (error) {
          // TODO: handle mongo errors
          console.error(error);
        }
        return adminUser;
      }
    },

    /**
     * Find admin user by api key
     * @actions
     * @param {String} apiKey - Token of the existing api key
     * @returns {Object} - Authenticated admin user
     */
    findByApiKey: {
      params: {
        apiKey: {
          type: "string"
        }
      },
      async handler(ctx) {
        const adminUser = await AdminUser.findOne({
          apiKeys: {
            $elemMatch: {
              token: ctx.params.apiKey,
            }
          }
        });
        return adminUser;
      }
    }

  },

  methods: {

  }
};
