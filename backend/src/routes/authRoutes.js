const express = require("express");

const {
  registerAdmin,
  loginAdmin,
} = require("../controllers/authController");

const router = express.Router();

// Public admin register route is disabled for real use.
// Admin should be created manually/seeded before disabling this route.
// router.post("/register", registerAdmin);

router.post("/login", loginAdmin);

module.exports = router;