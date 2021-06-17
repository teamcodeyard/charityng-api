"use strict";
const DBMixin = require('../mixins/db.mixin');
const User = require('../models/user');
const { USER } = require("../models/constants");

module.exports = {
  name: "admin.users",
  mixins: [DBMixin("users")],
  model: User,

  settings: {
    fields: ["_id", "email", "profileImageUrl", "firstName", "lastName", "bio", "status"],
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
        fullPath: "/admin/users/:id",
        path: "/:id"
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

    deactivate: {
      rest: {
        method: "POST",
        fullPath: "/admin/users/:id/deactivate",
        path: "/:id/ban"
      },
      params: {
        id: {
          type: "string",
        },
      },
      async handler(ctx) {
        return await this.changeUserStatus(ctx, USER.STATUS.INACTIVE)
      }
    },

    activate: {
      rest: {
        method: "POST",
        fullPath: "/admin/users/:id/activate",
        path: "/:id/ban"
      },
      params: {
        id: {
          type: "string",
        },
      },
      async handler(ctx) {
        return await this.changeUserStatus(ctx, USER.STATUS.ACTIVE)
      }
    }

  },

  methods: {
    async changeUserStatus(ctx, status) {
      const user = await this.adapter.findOne({ _id: ctx.params.id })
      user.status = status;
      user.save();
      this.broker.broadcast("cache.clean.users");
      return this.transformDocuments(ctx, {/* TODO: populates */ }, user);
    }
  },

  started() {

  },

  events: {
    "cache.clean.users"() {
      this.broker.cacher.clean('admin.users.**');
    }
  }
};
