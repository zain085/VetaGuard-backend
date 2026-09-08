const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const Notification = require("../models/Notification");

// GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.query;
  const filter = { user: req.user._id };
  if (unreadOnly === "true") filter.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  sendSuccess(res, 200, "Notifications retrieved successfully", { notifications, unreadCount });
});

// PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, "Notification not found");
  if (notification.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not own this notification");
  }
  notification.isRead = true;
  await notification.save();
  sendSuccess(res, 200, "Notification marked as read", { notification });
});

// PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  sendSuccess(res, 200, "All notifications marked as read", {});
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
