const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const {
  getDashboardStats,
  listUsers, updateUserStatus, deleteUser,
  listVetsForAdmin, approveVet, suspendVet,
  listSheltersForAdmin, approveShelter, suspendShelter,
  listReviewsForAdmin, moderateReview, deleteReview,
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/dashboard", getDashboardStats);

router.get("/users", listUsers);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

router.get("/vets", listVetsForAdmin);
router.patch("/vets/:id/approve", approveVet);
router.patch("/vets/:id/suspend", suspendVet);

router.get("/shelters", listSheltersForAdmin);
router.patch("/shelters/:id/approve", approveShelter);
router.patch("/shelters/:id/suspend", suspendShelter);

router.get("/reviews", listReviewsForAdmin);
router.patch("/reviews/:id/moderate", moderateReview);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
