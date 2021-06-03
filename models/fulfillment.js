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
  campaignId: { type: ObjectId, ref: "Campaign" },
  resourceId: { type: ObjectId },
}, {
  timestamps: true
});

module.exports = mongoose.model("Fulfillment", CampaignFulfillmentSchema);