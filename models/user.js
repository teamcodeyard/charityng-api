const mongoose = require("mongoose");
const Schema = mongoose.Schema;
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
  forgottenPasswordTokens: { type: [ForgottenPasswordTokenSchema], default: [] }
}, {
  timestamps: true
});

UserSchema.index({ email: "text", firstName: "text", lastName: "text", bio: "text" });

module.exports = mongoose.model("User", UserSchema);
