"use strict";
const DBMixin = require('../mixins/db.mixin');
const User = require('../models/user');

module.exports = {
  name: "admin.users",
  mixins: [DBMixin("users")],
  model: User,

  settings: {
    fields: ["_id", "email", "profileImageUrl", "firstName", "lastName", "bio"],
  },

  actions: {
    count: false,
    remove: false,
    insert: false,
    find: false,
    update: false,
    create: false,
    list: false,

    list: {
      cache: {
        keys: ["text", "pageNumber", "pageSize"]
      },
      params: {
        text: {
          type: "string",
          optional: true,
          default: '',
          convert: true,
        },
        pageNumber: {
          type: "number"
        },
        pageSize: {
          type: "number",
          default: 10,
        }
      },
      async handler(ctx) {
        const { text, pageNumber, pageSize } = ctx.params;
        const users = await this.adapter.find({
          query: {
            $or: [
              { email: { $regex: `.*${text}.*`, $options: '-i' } },
              { firstName: { $regex: `.*${text}.*`, $options: '-i' } },
              { lastName: { $regex: `.*${text}.*`, $options: '-i' } },
              { bio: { $regex: `.*${text}.*`, $options: '-i' } }
            ],
          },
          offset: pageNumber * pageSize,
          limit: pageSize
        });
        return this.transformDocuments(ctx, {}, users);
      }
    }
  },

  methods: {
  },

  started() {
  },

  events: {
    "cache.clean.users"() {
      this.broker.cacher.clean('admin.users.**');
    }
  }
};
