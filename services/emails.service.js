"use strict";
const nodemailer = require("nodemailer");
const vash = require('vash');
const fs = require('fs');

module.exports = {
  name: "emails",
  
  actions: {
    sendEmail: {
      params: {
        subject: {
          type: "string",
        },
        receivers: {
          type: "array"
        },
        templateName: {
          type: "string"
        },
        locale: {
          type: "string",
          optional: true,
          default: 'en'
        },
        variables: {
          type: "object",
          optional: true,
          default: {}
        }
      },
      async handler(ctx) {
        const template = fs.readFileSync(`templates/emails/${ctx.params.locale}/${ctx.params.templateName}.html`, "utf-8");
        const tpl = vash.compile(template);
        const contentHTML = tpl(ctx.params.variables);
        // send mail with defined transport object
        let info = await this.mailTransporter.sendMail({
          from: process.env.EMAIL_SENDER_ADDRESS,
          to: ctx.params.receivers,
          subject: ctx.params.subject,
          html: contentHTML
        });

        console.info("Message sent: %s", info.messageId);
        console.info("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      },

    },
  },

  methods: {
  },

  async created() {
    // create reusable transporter object using the default SMTP transport
    this.mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP || false, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

};
