const mongoose = require("mongoose");
const { CAMPAIGN } = require("./constants");
const Schema = mongoose.Schema;

const CampaignResourceSchema = Schema({
  name: { type: String, required: true },
  type: { type: Number, default: CAMPAIGN.RESOURCE.MATERIAL },
  quantity: { type: Number, default: 1 }
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
  // TODO: add fulfillments
}, {
  timestamps: true
});

module.exports = mongoose.model("Campaign", CampaignSchema);