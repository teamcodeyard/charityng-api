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

const CampaignFulfillmentSchema = Schema({
  userId: { type: ObjectId, ref: "User", required: true },
  quantity: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value'
    }
  },
  status: { type: Number, default: CAMPAIGN.FULFILLMENT.STATUS.PENDING },
  messages: { type: [CampaignMessageSchema], default: [] },
}, {
  timestamps: true
});

const CampaignResourceSchema = Schema({
  name: { type: String, required: true },
  type: { type: Number, default: CAMPAIGN.RESOURCE.MATERIAL },
  quantity: { type: Number, default: 1 },
  fulfillments: { type: [CampaignFulfillmentSchema], default: [] },
});

const MediaSchema = Schema({
  url: { type: String, required: true },
});

const CampaignSchema = Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: Number, default: CAMPAIGN.STATUS.DRAFT },
  mediaList: { type: [MediaSchema], default: [] },
  resources: { type: [CampaignResourceSchema], default: () => ({}) },
}, {
  timestamps: true
});

module.exports = mongoose.model("Campaign", CampaignSchema);