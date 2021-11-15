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
    fields: ['_id', 'userId', 'quantity', 'status', 'messages', 'campaignId', 'resourceId', 'campaign', 'resources'],
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
        fullPath: '/api/campaigns/:campaignId/fulfillments'
      },
      params: {
        campaignId: {
          type: "string"
        },
        resources: {
          type: "array"
        },
        message: {
          type: "string",
          min: 12,
        }
      },
      async handler(ctx) {
        const campaign = await ctx.call('campaigns.get', { id: ctx.params.campaignId });
        const fulfillment = await this.adapter.insert({
          userId: ctx.meta.user._id,
          messages: [
            {
              userId: ctx.meta.user._id,
              message: ctx.params.message,
            }
          ],
          campaignId: campaign._id,
          resources: ctx.params.resources
        })
        //if(fulfillment.status === CAMPAIGN.FULFILLMENT.STATUS.COMPLETED) {
        ctx.call('campaigns.updateResourceFulfillments', { fulfillment });
        //}
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
        fulfillmentId: {
          type: "string",
        },
        message: {
          type: "string",
        },
      },
      async handler(ctx) {
        const { campaignId, resourceId, fulfillmentId } = ctx.params;
        const fulfillment = await this.adapter.findOne({ campaignId, _id: fulfillmentId });
        if (fulfillment.userId.toString() !== ctx.meta.user._id.toString() && !ctx.meta.userIsAdmin) {
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

    /**
     * TODO: write comments
     */
    list: {
      cache: {
        keys: ['#user._id']
      },
      params: {
      },
      async handler(ctx) {
        const fulfillments = await Fulfillment.find({ userId: ctx.meta.user._id }).populate(['campaign', {
          path: 'messages.user',
          select: ['firstName', 'lastName']
        }]);
        return this.transformDocuments(ctx, {}, fulfillments);
      },
    },
  }
};
