"use strict";
const DBMixin = require('../mixins/db.mixin');
const Reward = require('../models/reward');

module.exports = {
  name: "rewards",
  mixins: [DBMixin("rewards")],
  model: Reward,

  settings: {
    fields: ['_id', 'name', 'color'],

    entityValidator: {
      name: {
        type: "string",
        min: 1
      },
      color: {
        type: "string",
        min: 3, max: 6,
      }
    }
  },

  actions: {
    count: false,
    insert: false,
    find: false,
    /** Use default CRUD actions like create, get, remove, update, list */
  },

  methods: {
  },

};
