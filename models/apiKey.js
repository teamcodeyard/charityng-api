const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ApiKeySchema = Schema({
  token: { type: String, required: true },
  deviceId: { type: String, required: true },
}, {
  timestamps: true
});

module.exports = {
  ApiKeySchema,
}