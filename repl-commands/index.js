"use strict";

module.exports = [{
  command: "campaigns",
  description: "List all active campaign for user",
  alias: ["c"],
  options: [
    {
      option: "-u, --user <userID>",
      description: "User ID"
    },
    {
      option: "-s, --status <status>",
      description: "Status"
    }
  ],
  async action(broker, args) {
    const { options } = args;
    const campaigns = await broker.call(
      "campaigns.list", { status: String(options.status || 0) }, { meta: { user: { _id: options.user }, $repl: true } }
    );
    console.table(campaigns);
  }
}];