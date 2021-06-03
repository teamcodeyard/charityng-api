"use strict";
const DBMixin = require('../mixins/db.mixin');
const Fulfillment = require('../models/fulfillment');
const { CAMPAIGN } = require('../models/constants');
const { UnAuthorizedError } = require("moleculer-web").Errors;

module.exports = {
  name: "fulfillments",
  mixins: [DBMixin("fulfillments")],
  model: Fulfillment,

  settings: {
    fields: ['_id', 'userId', 'quantity', 'status', 'messages', 'campaignId', 'resourceId'],
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
      rest: {
        method: 'POST',
        fullPath: '/api/campaigns/:campaignId/resources/:resourceId/fulfillments'
      },
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
        const campaign = await ctx.call('campaigns.get', { id: ctx.params.campaignId });
        const resource = campaign.resources.find(x => x._id.toString() === ctx.params.resourceId);
        const fulfillment = await this.adapter.insert({
          userId: ctx.meta.user._id,
          messages: [
            {
              senderUserId: ctx.meta.user._id,
              message: ctx.params.message,
            }
          ],
          quantity: ctx.params.quantity,
          campaignId: campaign._id,
          resourceId: resource._id
        })
        await ctx.call('campaigns.appendFulfillment', {
          campaignId: campaign._id.toString(),
          resourceId: resource._id.toString(),
          fulfillmentId: fulfillment._id.toString(),
        });
        return this.transformDocuments(ctx, {}, fulfillment);
      }
    },

    /**
    * TODO: write comments
    */
    sendMessage: {
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
        const { campaignId, resourceId, fulfillmentId } = ctx.params;
        const fulfillment = await this.adapter.findOne({ campaignId, resourceId, _id: fulfillmentId });
        if (fulfillment.userId.toString() !== ctx.meta.user._id.toString()) {
          throw new UnAuthorizedError(); // TODO: use proper errors
        }
        const message = { message: ctx.params.message };
        if (ctx.meta.userIsAdmin) {
          message.adminUserId = ctx.meta.user._id;
        } else {
          message.userId = ctx.meta.user._id;
        }
        fulfillment.messages.push(message);
        fulfillment.save();
        return this.transformDocuments(ctx, {}, fulfillment);
      }
    },

    /**
   * TODO: write comments
   */
    updateStatus: {
      rest: {
        method: "POST",
        fullPath: "/admin/campaigns/:campaignId/resources/:resourceId/fulfillments/:fulfillmentId/updateStatus",
      },
      params: {
        campaignId: {
          type: "string"
        },
        status: {
          type: "number",
          min: CAMPAIGN.FULFILLMENT.STATUS.PENDING,
          max: CAMPAIGN.FULFILLMENT.STATUS.FAILED,
        },
        resourceId: {
          type: "string",
        },
        fulfillmentId: {
          type: "string",
        },
      },
      async handler(ctx) {
        const { campaignId, resourceId, fulfillmentId } = ctx.params;
        const fulfillment = await this.adapter.findOne({ campaignId, resourceId, _id: fulfillmentId });
        fulfillment.status = ctx.params.status;
        fulfillment.save();
        return this.transformDocuments(ctx, {}, fulfillment);
      },
    },

    /**
   * TODO: write comments
   */
    listOwnByCampaign: {
      cache: {
        keys: ['campaignId', 'resourceId', '#user._id']
      },
      params: {
        campaignId: {
          type: "string"
        },
        resourceId: {
          type: "string",
        },
      },
      async handler(ctx) {
        const { campaignId } = ctx.params;
        const fulfillments = await this.adapter.find({ query: { campaignId, userId: ctx.meta.user._id } });
        return this.transformDocuments(ctx, {}, fulfillments);
      },
    },
  }
};
