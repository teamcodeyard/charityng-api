const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContactSchema = Schema({
  address: { type: String },
  phone: { type: String },
  email: { type: String },
});

const ThemeColorsSchema = Schema({
  primary: { type: String, default: '673AB7' },
  secondary: { type: String, default: 'BBDEFB' },
});

const OrganisationSchema = Schema({
  name: { type: String, default: 'Charityng Example Organisation' },
  logoUrl: { type: String, default: '/organisationDefault.png' },
  contact: { type: ContactSchema },
  introduction: { type: String, default: 'This is an example organisation for Charityng API, please configure it!' },
  colors: { type: ThemeColorsSchema, default: () => ({}) }
}, {
  timestamps: true
});

module.exports = mongoose.model("Organisation", OrganisationSchema);