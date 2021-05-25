module.exports = {
  CAMPAIGN: {
    STATUS: {
      DRAFT: 0,
      ACTIVE: 1,
      PAUSED: 2,
      COMPLETED: 3,
      FAILED: 4
    },
    RESOURCE: {
      MATERIAL: 0,
      HUMAN: 1
    },
    FULFILLMENT: {
      STATUS: {
        PENDING: 0,
        COMPLETED: 1,
        FAILED: 2,
      },
      MESSAGE: {
        STATUS: {
          UNREAD: 0,
          READ: 1,
        },
      }
    }
  }
}