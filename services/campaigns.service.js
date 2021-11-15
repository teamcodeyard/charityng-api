"use strict";
const DBMixin = require('../mixins/db.mixin');
const Campaign = require('../models/campaign');
const { CAMPAIGN } = require('../models/constants');
const { ValidationError } = require('moleculer').Errors;
const Fulfillment = require('../models/fulfillment');
const AWSMixin = require('../mixins/aws.mixin');

module.exports = {
  name: "campaigns",
  mixins: [DBMixin("campaigns"), AWSMixin],
  model: Campaign,

  settings: {
    fields: ['_id', 'title', 'description', 'status', 'mediaList', 'resources'],
    entityValidator: {
      title: { type: "string", min: 10 },
      description: { type: "string", min: 10 },
      resources: {
        optional: true,
        type: "array", props: {
          name: {
            type: "string",
            min: 3
          },
          type: {
            type: "number",
            min: 0,
            max: 1,
          },
          quantity: {
            type: "number",
            min: 1,
          },
        }
      },
      location: { type: "string" },
      deadline: { type: "string", convert: true }
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
        const campaigns = await Campaign.find({
          status: ctx.params.status,
          "resources.fulfillments.userId": ctx.meta.user._id,
        }).populate('resources.fulfillments');
        return this.transformDocuments(ctx, {}, campaigns);
      },
    },

    /**
    * TODO: write comments
    */
    filter: {
      auth: false,
      cache: {
        keys: ["status"]
      },
      rest: {
        method: "GET",
        path: '/filter'
      },
      params: {
        status: {
          type: "string",
          optional: true,
          default: CAMPAIGN.STATUS.ACTIVE,
          convert: true,
        },
        text: {
          type: "string",
          optional: true,
          default: '',
          convert: true,
        },
      },
      async handler(ctx) {
        const { text, status } = ctx.params;
        const query = {
          $and: [
            {
              $or: [
                { title: { $regex: `.*${text}.*`, $options: '-i' } },
                { description: { $regex: `.*${text}.*`, $options: '-i' } }
              ]
            },
            { status }]
        };
        const campaigns = await this.adapter.find({ query });
        return this.transformDocuments(ctx, {}, campaigns);
      },
    },

    /**
    * TODO: write comments
    */
    updateStatus: {
      rest: {
        method: "POST",
        fullPath: "/admin/campaigns/:campaignId/updateStatus",
        path: "/:campaignId/updateStatus"
      },
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
        this.clearCache();
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
      auth: false,
      cache: {
        keys: ['id']
      },
      params: {
        id: {
          type: "string"
        }
      },
      async handler(ctx) {
        const campaign = await Campaign.findOne({ _id: ctx.params.id })
          .populate({
            path: 'resources.fulfillments',
          });
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

    /**
    * TODO: write comments
    */
    updateResourceFulfillments: {
      params: {
        fulfillment: {
          type: "object"
        },
      },
      async handler(ctx) {
        const campaign = await this.adapter.findById({ _id: ctx.params.fulfillment.campaignId });
        console.log(ctx.params);
        ctx.params.fulfillment.resources.forEach(x => {
            const resource = campaign.resources.find(y => y._id.toString() === x.resourceId.toString());
            if(resource) {
              resource.fulfillments.push(ctx.params.fulfillment._id)
            } else {
              console.log("No resource dikk%")
            }
        });
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
      rest: "POST /:campaignId/media",
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

    deleteMedia: {
      rest: "DELETE /:campaignId/media/:mediaId",
      params: {
        campaignId: {
          type: "string"
        },
        mediaId: {
          type: "string"
        }
      },
      async handler(ctx) {
        const campaign = await this.adapter.findById({ _id: ctx.params.campaignId });
        const media = campaign.mediaList.find(x => x._id.toString() === ctx.params.mediaId);
        if (media) {
          await this.deleteFile(media.url.split('amazonaws.com/')[1]); // TODO: refactor media uris
          const updatedCampaign = await this.adapter.updateById(campaign._id, {
            $pull: {
              mediaList: {
                _id: media._id
              }
            }
          });
          this.clearCache();
          return updatedCampaign;
        }
      }
    },

    /**
    * TODO: write comments
    */
    update: {
      params: {
        id: {
          type: "string",
        },
        title: {
          type: "string",
          min: 10,
        },
        description: {
          type: "string",
          min: 10,
        },
      },
      async handler(ctx) {
        const { id, title, description } = ctx.params;
        const updatedCampaign = await this.adapter.updateById(id, {
          $set: {
            title,
            description
          }
        });
        return this.transformDocuments(ctx, {}, updatedCampaign);
      }
    },

    /**
    * TODO: write comments
    * TODO: fix optional properties
    */
    updateResource: {
      rest: "PUT /:campaignId/resources/:resourceId",
      params: {
        campaignId: {
          type: "string"
        },
        resourceId: {
          type: "string",
        },
        name: {
          type: "string",
          min: 3,
        },
        type: {
          type: "number",
          min: 0,
          max: 1,
        },
        quantity: {
          type: "number",
          min: 1,
        },
      },
      async handler(ctx) {
        const { campaignId, resourceId, name, type, quantity } = ctx.params;
        const updatedCampaign = await Campaign.findOneAndUpdate({ _id: campaignId, "resources._id": resourceId }, {
          $set: {
            "resources.$.name": name,
            "resources.$.type": type,
            "resources.$.quantity": quantity
          }
        }, { returnOriginal: false });

        return this.transformDocuments(ctx, {}, updatedCampaign);
      }
    },

    /**
    * TODO: write comments
    */
    remove: {
      rest: "DELETE /:id",
      params: {
        id: {
          type: "string"
        }
      },
      async handler(ctx) {
        const response = await Campaign.deleteOne({ _id: ctx.params.id });
        // TODO use mongoose middleware
        if (response.ok === 1) {
          await Fulfillment.deleteMany({ campaignId: ctx.params.id });
        }
        return response;
      }
    },

    /**
     * List all campaigns for admin users
     */
    listAll: {
      rest: {
        method: "GET",
        fullPath: "/admin/campaigns",
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
        const query = {
          $or: [
            { title: { $regex: `.*${text}.*`, $options: '-i' } },
            { description: { $regex: `.*${text}.*`, $options: '-i' } }
          ]
        };
        const users = await this.adapter.find({
          query,
          offset: pageNumber * pageSize,
          limit: pageSize
        });
        const list = await this.transformDocuments(ctx, {}, users);
        const allCount = await this.adapter.count(query);
        const pageCount = Math.ceil(allCount / pageSize);
        return {
          list,
          pageNumber,
          pageCount
        }
      }
    },

    /**
    * TODO: write comments
    */
    getByAdmin: {
      cache: {
        keys: ['id', '#user._id']
      },
      rest: {
        method: "GET",
        fullPath: "/admin/campaigns/:id",
        path: "/"
      },
      params: {
        id: {
          type: "string"
        }
      },
      async handler(ctx) {
        const campaign = await Campaign.findOne({ _id: ctx.params.id })
          .populate('resources.fulfillments')
        // TODO: populate user
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

    /**
    * TODO: write comments
    */
    addResource: {
      cache: /*{
                          keys: ['id', '#user._id']
            },*/false,
      rest: {
        method: "POST",
        fullPath: "/admin/campaigns/:id/resources",
        path: "/"
      },
      params: {
        id: {
          type: "string"
        },
        resource: {
          type: 'object'
        }
      },
      async handler(ctx) {
        const campaign = await Campaign.findOne({ _id: ctx.params.id })
        campaign.resources.push(ctx.params.resource);
        await this.validateEntity(campaign);
        campaign.save();
        this.clearCache();
        return this.transformDocuments(ctx, {}, campaign);
      }
    },

  },
};
