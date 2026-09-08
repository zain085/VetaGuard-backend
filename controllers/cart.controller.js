const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { sendSuccess } = require("../utils/apiResponse");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

async function populateAndRespond(res, cart, status, message) {
  await cart.populate("items.product", "name slug price images stock isActive");
  const total = cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  sendSuccess(res, status, message, { cart, total });
}

// GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await populateAndRespond(res, cart, 200, "Cart retrieved successfully");
});

// POST /api/cart/items
const addItem = asyncHandler(async (req, res) => {
  const { product: productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");
  if (product.stock < quantity) throw new ApiError(400, "Not enough stock available");

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find((item) => item.product.toString() === productId);

  if (existingItem) {
    existingItem.quantity += Number(quantity);
    existingItem.priceSnapshot = product.price;
  } else {
    cart.items.push({ product: productId, quantity, priceSnapshot: product.price });
  }

  await cart.save();
  await populateAndRespond(res, cart, 200, "Item added to cart");
});

// PATCH /api/cart/items/:productId
const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === req.params.productId);
  if (!item) throw new ApiError(404, "Item not found in cart");

  const product = await Product.findById(req.params.productId);
  if (product && product.stock < quantity) throw new ApiError(400, "Not enough stock available");

  item.quantity = quantity;
  await cart.save();
  await populateAndRespond(res, cart, 200, "Cart updated");
});

// DELETE /api/cart/items/:productId
const removeItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  await populateAndRespond(res, cart, 200, "Item removed from cart");
});

// DELETE /api/cart
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  await populateAndRespond(res, cart, 200, "Cart cleared");
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart };
