const express = require("express");

const protectAdmin = require("../middleware/authMiddleware");

const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createMenuItem,
  getMenuItems,
  getSingleMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
} = require("../controllers/menuController");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Menu route is working",
  });
});

// Category routes
router.post("/categories", protectAdmin, createCategory);
router.get("/categories", getCategories);
router.put("/categories/:id", protectAdmin, updateCategory);
router.delete("/categories/:id", protectAdmin, deleteCategory);

// Menu item routes
router.post("/items", protectAdmin, createMenuItem);
router.get("/items", getMenuItems);
router.get("/items/:id", getSingleMenuItem);
router.put("/items/:id", protectAdmin, updateMenuItem);
router.patch("/items/:id/availability", protectAdmin, toggleMenuItemAvailability);
router.delete("/items/:id", protectAdmin, deleteMenuItem);

module.exports = router;