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

    /**
     * Update default organisation
     * @actions
     * @params {String} name - Name of the organisation
     * @params {String} introduction - Introduction text 
     * @params {Object} contact - Contact information
     * @params {Object} colors - Colors for client UI scheme
     */
    update: {
      rest: "PUT /update",
      params: {
        name: { type: "string", optional: true },
        introduction: { type: "string", optional: true },
        contact: {
          type: "object",
          optional: true,
          props: {
            address: { type: "string", optional: true },
            phone: { type: "string", convert: true, optional: true },
            email: { type: "email", optional: true }
          }
        },
        colors: {
          type: "object",
          optional: true,
          props: {
            primary: { type: "string", min: 3, max: 6, optional: true },
            secondary: { type: "string", min: 3, max: 6, optional: true }
          }
        }
      },
      async handler(ctx) {
        const organisation = await this.adapter.findOne({});
        const { params } = ctx;
        const updatedOrganisation = await this.adapter.updateById(organisation._id, {
          $set: params,
        });
        return updatedOrganisation;
      }
    }

  },

  methods: {
  },

};
