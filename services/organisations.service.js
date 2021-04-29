"use strict";
const DBMixin = require('../mixins/db.mixin');
const Organisation = require('../models/organisation');

module.exports = {
  name: "organisations",
  mixins: [DBMixin("organisations")],
  model: Organisation,

  settings: {
  },

  actions: {
    count: false,
    remove: false,
    insert: false,
    find: false,
    create: false,

    /**
     * TODO: write comments
     */
    initializeDefault: {
      async handler(ctx) {
        const count = await this.adapter.count();
        if (count > 0) {
          console.warn('\n⚠️ Organisation is already initialized! Skipped!\n');
          return;
        }
        const organisation = await this.adapter.insert({});
        return organisation;
      }
    },

  },

  methods: {
  },

};
