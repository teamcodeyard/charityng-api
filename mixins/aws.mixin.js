"use strict";
const AWS = require('aws-sdk');

module.exports = {
  settings: {
    aws: {
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      acl: 'public-read',
    },
  },

  created() {
    this.s3 = new AWS.S3();
    this.s3.config.update(this.settings.aws);
  },

  methods: {
    uploadFile(path, buffer) {
      return new Promise((resolve, reject) => {
        const params = {
          Bucket: this.settings.aws.bucketName,
          Body: buffer,
          Key: path,
          ACL: this.settings.aws.acl,
        }
        this.s3.upload(params, (err, data) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          resolve(data);
        });
      });
    },

    deleteFile(path) {
      return new Promise((resolve, reject) => {
        const params = {
          Bucket: this.settings.aws.bucketName,
          Key: path,
        }
        this.s3.deleteObject(params, (err, data) => {
          if (err) {
            console.error(err);
            return reject(err);
          }
          resolve(data);
        });
      })
    }
  }
};