import express from "express";
import {
   getCategories,
   getCategory,
   createCategory,
   updateCategory,
   deleteCategory,
   getCategoryStats,
} from "../controllers/categoryController";
import {
   validateCategory,
   validatePagination,
   validateObjectId,
   validateSearch,
   handleValidationErrors,
} from "../middleware/validation";
import { createLimiter } from "../middleware/rateLimit";

const router = express.Router();

// All routes are now public (no authentication required)
router.get(
   "/",
   validatePagination,
   validateSearch,
   handleValidationErrors,
   getCategories
);
router.get("/stats", getCategoryStats);
router.get("/:id", validateObjectId, handleValidationErrors, getCategory);

// Admin routes (no authentication required)
router.post("/", createLimiter, validateCategory, handleValidationErrors, createCategory);
router.put(
   "/:id",
   validateObjectId,
   validateCategory,
   handleValidationErrors,
   updateCategory
);
router.delete("/:id", validateObjectId, handleValidationErrors, deleteCategory);

export default router;
