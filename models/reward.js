const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RewardSchema = Schema({
  name: { type: String },
  color: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("Reward", RewardSchema);
