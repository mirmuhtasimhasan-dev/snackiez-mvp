const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createOrder,
  getOrders,
  trackOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Order route is working",
  });
});

// Public routes
router.post("/", createOrder);
router.get("/track/:orderCode", trackOrder);

// Admin protected routes
router.get("/", protectAdmin, getOrders);
router.patch("/:id/status", protectAdmin, updateOrderStatus);

module.exports = router;