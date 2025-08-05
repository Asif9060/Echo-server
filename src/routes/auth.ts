import express from "express";
import {
   login,
   register,
   logout,
   getProfile,
   updateProfile,
   changePassword,
} from "../controllers/authController";
import { authenticate, authorize } from "../middleware/auth";
import {
   validateAdminLogin,
   validateAdminRegistration,
   handleValidationErrors,
} from "../middleware/validation";
import { authLimiter } from "../middleware/rateLimit";

const router = express.Router();

// Public routes
router.post("/login", authLimiter, validateAdminLogin, handleValidationErrors, login);

// Protected routes
router.post(
   "/register",
   authenticate,
   authorize("super_admin"),
   validateAdminRegistration,
   handleValidationErrors,
   register
);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.put("/change-password", authenticate, changePassword);

export default router;
