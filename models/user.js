const mongoose = require("mongoose");
const { USER } = require("./constants");
const Schema = mongoose.Schema;
const ObjectId = mongoose.ObjectId;
const { ApiKeySchema } = require('./apiKey');

const ForgottenPasswordTokenSchema = Schema({
  token: { type: String, unique: true },
}, {
  timestamps: true
});

const UserSchema = Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  apiKeys: { type: [ApiKeySchema], default: [] },
  profileImageUrl: { type: String, default: '/default.png' },
  bio: { type: String },
  forgottenPasswordTokens: { type: [ForgottenPasswordTokenSchema], default: [] },
  status: { type: Number, default: USER.STATUS.ACTIVE },
  rewardId: { type: ObjectId, ref: "Reward" }
}, {
  timestamps: true
});

UserSchema.index({ email: "text", firstName: "text", lastName: "text", bio: "text" });

module.exports = mongoose.model("User", UserSchema);
