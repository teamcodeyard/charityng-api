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
    get: false,

    list: {
      rest: {
        method: "GET",
        fullPath: "/admin/users",
        path: "/"
      },
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
          query: text ? {
            $text: { $search: text }
          } : null,
          offset: pageNumber * pageSize,
          limit: pageSize
        });
        return this.transformDocuments(ctx, {}, users);
      }
    },

    /**
     * Get end user profile
     * @actions
     * @params {String} id - Id of the requested user
     * @return {Object} user - User object
     */
    get: {
      rest: {
        method: "GET",
        fullPath: "/admin/users/:userId",
        path: "/:userId"
      },
      cache: {
        keys: ["id"]
      },
      params: {
        id: {
          type: "string",
        },
      },
      async handler(ctx) {
        const user = await this.adapter.findOne(ctx.params.id);
        return this.transformDocuments(ctx, {/* TODO: populates */ }, user);
      }
    },
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
