const mongoose = require("mongoose");
const { CAMPAIGN } = require("./constants");
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;

const CampaignMessageSchema = Schema({
  userId: { type: ObjectId, ref: "User" },
  adminUserId: { type: ObjectId, ref: "AdminUser" },
  message: { type: String, required: true },
  status: { type: Number, default: CAMPAIGN.FULFILLMENT.MESSAGE.STATUS.UNREAD },
}, {
  timestamps: true
});

const CampaignFulfillmentResourcesSchema = Schema({
  resourceId: { type: ObjectId, ref: "Resource" },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
});

const CampaignFulfillmentSchema = Schema({
  userId: { type: ObjectId, ref: "User", required: true },
  status: { type: Number, default: CAMPAIGN.FULFILLMENT.STATUS.PENDING },
  messages: { type: [CampaignMessageSchema], default: [] },
  campaignId: { type: ObjectId, ref: "Campaign" },
  resources: { type: [CampaignFulfillmentResourcesSchema] }
}, {
  timestamps: true
});

CampaignFulfillmentSchema.virtual('campaign', {
  ref: 'Campaign',
  localField: 'campaignId',
  foreignField: '_id',
  justOne: true
});

CampaignFulfillmentSchema.set('toObject', { virtuals: true });
CampaignFulfillmentSchema.set('toJSON', { virtuals: true });

CampaignMessageSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

CampaignMessageSchema.set('toObject', { virtuals: true });
CampaignMessageSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Fulfillment", CampaignFulfillmentSchema);