"use strict";
const DBMixin = require('../mixins/db.mixin');
const Campaign = require('../models/campaign');
const { CAMPAIGN } = require('../models/constants');

module.exports = {
  name: "campaigns",
  mixins: [DBMixin("campaigns")],
  model: Campaign,

  settings: {
    fields: ['_id', 'title', 'description', 'status', 'mediaList', 'resources', 'fulfillments'],
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
    get: false,
    list: false,
    update: false,

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

    /**
    * TODO: write comments
    */
    createFulfillment: {
      rest: "POST /:campaignId/resources/:resourceId/fulfillments",
      params: {
        campaignId: {
          type: "string"
        },
        resourceId: {
          type: "string",
        },
        quantity: {
          type: "number",
          min: 1,
        },
        message: {
          type: "string",
          min: 12,
        }
      },
      async handler(ctx) {
        const campaign = await this.adapter.findById({ _id: ctx.params.campaignId });
        const resource = campaign.resources.find(x => x._id.toString() === ctx.params.resourceId);
        resource.fulfillments.push({
          userId: ctx.meta.user._id,
          messages: [
            {
              senderUserId: ctx.meta.user._id,
              message: ctx.params.message,
            }
          ],
          quantity: ctx.params.quantity,
        });
        await campaign.save();
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

    /**
    * TODO: write comments
    */
    sendMessage: {
      rest: "POST /:campaignId/resources/:resourceId/fulfillments/:fulfillmentId",
      params: {
        campaignId: {
          type: "string"
        },
        resourceId: {
          type: "string",
        },
        fulfillmentId: {
          type: "string",
        },
        message: {
          type: "string",
        },
      },
      async handler(ctx) {
        const campaign = await this.adapter.findById({ _id: ctx.params.campaignId });
        const resource = campaign.resources.find(x => x._id.toString() === ctx.params.resourceId);
        const fulfillment = resource.fulfillments.find(x => x._id.toString() === ctx.params.fulfillmentId);
        const message = { message: ctx.params.message };
        if (ctx.meta.userIsAdmin) {
          message.adminUserId = ctx.meta.user._id;
        } else {
          message.userId = ctx.meta.user._id;
        }
        fulfillment.messages.push(message);
        await campaign.save();
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

    /**
    * TODO: write comments
    */
    list: {
      cache: {
        keys: ["status", "#user._id"]
      },
      params: {
        status: {
          type: "number",
          default: CAMPAIGN.STATUS.ACTIVE
        }
      },
      async handler(ctx) {
        const campaigns = await this.adapter.find({
          query: {
            status: ctx.params.status,
            "resources.fulfillments.userId": ctx.meta.user._id,
          },
        });
        return this.transformDocuments(ctx, {}, campaigns);
      },
    },

    /**
    * TODO: write comments
    */
    updateStatus: {
      params: {
        campaignId: {
          type: "string"
        },
        status: {
          type: "number",
          min: CAMPAIGN.STATUS.DRAFT,
          max: CAMPAIGN.STATUS.FAILED,
        }
      },
      async handler(ctx) {
        const campaign = await this.adapter.findById({ _id: ctx.params.campaignId });
        campaign.status = ctx.params.status;
        campaign.save();
        return this.transformDocuments(ctx, {}, campaign);
      },
    }

  },

  methods: {
  },

};
