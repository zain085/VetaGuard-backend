const Notification = require("../models/Notification");

/**
 * Create an in-app notification for a user. Callers should not await-block
 * critical request paths on this — failures here are logged, not thrown,
 * so a notification hiccup never breaks the underlying action (e.g. a
 * successful appointment confirmation shouldn't fail because a
 * notification insert failed).
 */
async function notify({ user, type, title, message, relatedEntity, relatedEntityId }) {
  try {
    await Notification.create({ user, type, title, message, relatedEntity, relatedEntityId });
  } catch (err) {
    console.error("[notification.service] Failed to create notification:", err.message);
  }
}

module.exports = { notify };
