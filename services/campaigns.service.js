"use strict";
const DBMixin = require('../mixins/db.mixin');
const Campaign = require('../models/campaign');

module.exports = {
  name: "campaigns",
  mixins: [DBMixin("campaigns")],
  model: Campaign,

  settings: {
    fields: ['_id', 'title', 'description', 'status', 'mediaList', 'resources'], // TODO: add fulfillments
    entityValidator: {
      title: { type: "string", min: 10 },
      description: { type: "string", min: 10 },
      resources: {
        type: "array", props: {
          name: "string",
          type: "number",
          quantity: "number"
        }
      },
    }
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
    create: {
      params: {
        campaign: {
          type: "object"
        }
      },
      async handler(ctx) {
        const campaign = new Campaign(ctx.params.campaign);
        await this.validateEntity(campaign);
        try {
          await campaign.save();
        } catch (error) {
          // TODO: handle mongo errors
          console.error(error);
        }
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

  },

  methods: {
  },

};
