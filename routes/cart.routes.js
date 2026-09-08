const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validation.middleware");
const { addCartItemValidator, updateCartItemValidator } = require("../validators/cart.validator");
const { getCart, addItem, updateItem, removeItem, clearCart } = require("../controllers/cart.controller");

const router = express.Router();

router.use(protect);

router.get("/", getCart);
router.post("/items", addCartItemValidator, validate, addItem);
router.patch("/items/:productId", updateCartItemValidator, validate, updateItem);
router.delete("/items/:productId", removeItem);
router.delete("/", clearCart);

module.exports = router;
