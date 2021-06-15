const mongoose = require("mongoose");
const { CAMPAIGN } = require("./constants");
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;

const CampaignResourceSchema = Schema({
  name: { type: String, required: true },
  type: { type: Number, default: CAMPAIGN.RESOURCE.MATERIAL },
  quantity: { type: Number, default: 1 },
  fulfillments: { type: [{ type: ObjectId, ref: "Fulfillment" }], default: [] },
});

const MediaSchema = Schema({
  url: { type: String, required: true },
});

const CampaignSchema = Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: Number, default: CAMPAIGN.STATUS.DRAFT },
  mediaList: { type: [MediaSchema], default: [] },
  resources: { type: [CampaignResourceSchema], default: () => ([]) },
}, {
  timestamps: true
});

module.exports = mongoose.model("Campaign", CampaignSchema);