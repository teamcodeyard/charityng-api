"use strict";
const bcrypt = require('bcrypt');
const hat = require('hat');
const DBMixin = require('../mixins/db.mixin');
const AuthenticationMixin = require('../mixins/authentication.mixin');
const AdminUser = require('../models/adminUser');

module.exports = {
  name: "admin.adminUsers",
  mixins: [DBMixin("adminUsers"), AuthenticationMixin],
  model: AdminUser,

  settings: {
    fields: ["_id", "email", "firstName", "lastName"],
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
    get: false,
    list: false,

    /**
     * TODO: write comments
     */
    create: {
      params: {
        adminUser: {
          type: "object"
        },
        deviceId: {
          type: "string"
        }
      },
      async handler(ctx) {
        const adminUser = new AdminUser(ctx.params.adminUser);
        await this.validateEntity(adminUser);
        adminUser.password = bcrypt.hashSync(adminUser.password, 10);
        adminUser.apiKeys.push({
          token: hat(256),
          deviceId: ctx.params.deviceId
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

  },

  methods: {
    async initializeAdminUser() {
      const count = await this.adapter.count();
      if (count === 0) {
        console.log("\n\n💥 Initialize first admin user from environment variables");
        await this.broker.call('admin.adminUsers.create', {
          adminUser: {
            email: process.env.ADMIN_USER_EMAIL,
            password: process.env.ADMIN_USER_PASSWORD,
            firstName: 'Default',
            lastName: 'Admin'
          },
          deviceId: 'SYSTEM'
        });
        await this.broker.call('organisations.initializeDefault');
        console.log("✅ DONE!\n\n")
      }
    }
  },

  started() {
    this.initializeAdminUser();
  }
};
