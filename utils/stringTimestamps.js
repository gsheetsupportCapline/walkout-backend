const { toCSTDateString } = require("./timezone");

/**
 * Apply string-based createdAt/updatedAt timestamps in CST.
 * This replaces mongoose timestamps for UTC Date fields.
 * @param {import('mongoose').Schema} schema
 */
const applyStringTimestamps = (schema) => {
  schema.add({
    createdAt: {
      type: String,
      default: () => toCSTDateString(),
    },
    updatedAt: {
      type: String,
      default: () => toCSTDateString(),
    },
  });

  schema.pre("save", function (next) {
    const now = toCSTDateString();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    this.updatedAt = now;
    next();
  });

  const setUpdateTimestamps = function () {
    const now = toCSTDateString();
    const update = this.getUpdate() || {};
    update.$set = update.$set || {};
    update.$set.updatedAt = now;
    update.$setOnInsert = update.$setOnInsert || {};
    if (!update.$setOnInsert.createdAt) {
      update.$setOnInsert.createdAt = now;
    }
    this.setUpdate(update);
  };

  schema.pre("updateOne", setUpdateTimestamps);
  schema.pre("updateMany", setUpdateTimestamps);
  schema.pre("findOneAndUpdate", setUpdateTimestamps);
  schema.pre("update", setUpdateTimestamps);
};

module.exports = { applyStringTimestamps };
