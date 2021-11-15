"use strict";
const DBMixin = require('../mixins/db.mixin');
const User = require('../models/user');
const { USER } = require("../models/constants");
const { BadRequestError } = require('moleculer-web').Errors;

module.exports = {
    name: "admin.users",
    mixins: [DBMixin("users")],
    model: User,

    settings: {
        fields: ["_id", "email", "profileImageUrl", "firstName", "lastName", "bio", "status", "rewardId"],
    },

    hooks: {
        after: {
            "*": async (ctx, res) => {
                if (res && res.rewardId) {
                    try {
                        res.reward = await ctx.call('rewards.get', { id: res.rewardId.toString() });
                    } catch (err) { console.error(err) } // TODO: think about it
                    delete res.rewardId;
                }
                return res;
            },
        },
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
                    type: "number",
                    convert: true
                },
                pageSize: {
                    type: "number",
                    default: 5,
                }
            },
            async handler(ctx) {
                const { text, pageNumber, pageSize } = ctx.params;
                const query = text ? {
                    $text: { $search: text }
                } : null;
                const users = await this.adapter.find({
                    query,
                    offset: pageNumber * pageSize,
                    limit: pageSize
                });
                const list = await this.transformDocuments(ctx, {}, users);
                const allCount = await this.adapter.count(query);
                const pageCount =  Math.ceil(allCount / pageSize);
                return {
                    list,
                    pageNumber,
                    pageCount
                }
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
                const user = await this.adapter.findOne({ _id: ctx.params.id });
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
                path: "/:id/activate"
            },
            params: {
                id: {
                    type: "string",
                },
            },
            async handler(ctx) {
                return await this.changeUserStatus(ctx, USER.STATUS.ACTIVE)
            }
        },

        assignReward: {
            rest: {
                method: "POST",
                fullPath: "/admin/users/:id/assignReward",
                path: "/:id/assignReward"
            },
            params: {
                id: {
                    type: "string",
                },
                rewardId: {
                    type: "string",
                },
            },
            async handler(ctx) {
                const reward = await ctx.call('rewards.get', { id: ctx.params.rewardId });
                const user = await this.adapter.findOne({ _id: ctx.params.id });
                if (!reward || !user) {
                    throw new BadRequestError(); // TODO: handle errors
                }
                user.rewardId = reward._id;
                await user.save();
                this.broker.broadcast("cache.clean.users");
                return this.transformDocuments(ctx, {}, user);
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
