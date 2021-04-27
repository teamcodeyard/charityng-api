const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ApiKeySchema = Schema({
  token: { type: String, required: true },
  deviceId: { type: String, required: true },
}, {
  timestamps: true
});

const AdminUserSchema = Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  apiKeys: { type: [ApiKeySchema], default: [] },
}, {
  timestamps: true
});

module.exports = mongoose.model("AdminUser", AdminUserSchema);