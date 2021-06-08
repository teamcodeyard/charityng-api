"use strict";
const DBMixin = require('../mixins/db.mixin');
const Campaign = require('../models/campaign');
const { CAMPAIGN } = require('../models/constants');
const hat = require('hat');
const { ValidationError } = require('moleculer').Errors;

module.exports = {
  name: "campaigns",
  mixins: [DBMixin("campaigns")],
  model: Campaign,

  settings: {
    fields: ['_id', 'title', 'description', 'status', 'mediaList', 'resources'],
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
    },
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
          type: "string",
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
    filter: {
      cache: {
        keys: ["status"]
      },
      params: {
        status: {
          type: "string",
          optional: true
        }
      },
      async handler(ctx) {
        const query = {};
        if (ctx.params.status) {
          query.status = ctx.params.status;
        }
        const campaigns = await this.adapter.find({ query });
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
    },

    /**
   * TODO: write comments
   */
    updateFulfillmentStatus: {
      rest: {
        method: "POST",
        fullPath: "/admin/campaigns/:campaignId/resources/:resourceId/fulfillments/:fulfillmentId/updateStatus",
        path: "/:campaignId/resources/:resourceId/fulfillments/:fulfillmentId/updateStatus"
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
        const campaign = await this.adapter.findById({ _id: ctx.params.campaignId });
        const resource = campaign.resources.find(x => x._id.toString() === ctx.params.resourceId);
        const fulfillment = resource.fulfillments.find(x => x._id.toString() === ctx.params.fulfillmentId);
        fulfillment.status = ctx.params.status;
        campaign.save();
        return this.transformDocuments(ctx, {}, campaign);
      },
    },

    /**
    * TODO: write comments
    */
    get: {
      cache: {
        keys: ['id', '#user._id']
      },
      params: {
        id: {
          type: "string"
        }
      },
      async handler(ctx) {
        const campaign = await Campaign.find({ _id: ctx.params.id })
          .populate({
            path: 'resources.fulfillments',
            match: { userId: ctx.meta.user._id }
          });
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

    /**
    * TODO: write comments
    */
    appendFulfillment: {
      params: {
        campaignId: {
          type: "string"
        },
        resourceId: {
          type: "string",
        },
        fulfillmentId: {
          type: "string"
        }
      },
      async handler(ctx) {
        const campaign = await this.adapter.findById({ _id: ctx.params.campaignId });
        const resource = campaign.resources.find(x => x._id.toString() === ctx.params.resourceId);
        resource.fulfillments.push(ctx.params.fulfillmentId);
        campaign.save();
        return campaign;
      }
    },

    /**
     * Upload images for campaign
     * @actions
     * @returns - Updated organisation with new logo url
     */
    uploadImages: {
      rest: "POST /:campaignId/uploadImages",
      hasFile: true,
      params: {
        campaignId: {
          type: "string"
        }
      },
      async handler(ctx) {
        if (!ctx.meta.files || ctx.meta.files.length == 0) {
          throw new ValidationError("MISSING FILE", 422, "MISSING FILE");
        }
        const campaign = await this.adapter.findById({ _id: ctx.params.campaignId });
        for (let i = 0; i < ctx.meta.files.length; i++) {
          const file = ctx.meta.files[i];
          campaign.mediaList.push({
            url: file.url
          })
          await campaign.save();
          this.clearCache();
        }
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

  },
};
