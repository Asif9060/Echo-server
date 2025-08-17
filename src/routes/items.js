import express from "express";
import {
   getItems,
   getItem,
   createItem,
   updateItem,
   deleteItem,
   bulkDeleteItems,
   updateItemStatus,
   getItemStats,
   uploadImage,
} from "../controllers/itemController.js";
import {
   validateItemRelaxed,
   validatePagination,
   validateObjectId,
   validateSearch,
   handleValidationErrors,
} from "../middleware/validation.js";
import { createLimiter } from "../middleware/rateLimit.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// All routes are now public (no authentication required)
router.get("/", validatePagination, validateSearch, handleValidationErrors, getItems);
router.get("/stats", getItemStats);
router.get("/:id", validateObjectId, handleValidationErrors, getItem);

// Image upload routes (support both /upload and /upload-image for compatibility)
router.post("/upload", upload.single("image"), uploadImage);
router.post("/upload-image", upload.single("image"), uploadImage);

// Admin routes (no authentication required)
router.post("/", createLimiter, validateItemRelaxed, handleValidationErrors, createItem);
router.put(
   "/:id",
   validateObjectId,
   validateItemRelaxed,
   handleValidationErrors,
   updateItem
);
router.patch("/:id/status", validateObjectId, handleValidationErrors, updateItemStatus);
router.delete("/:id", validateObjectId, handleValidationErrors, deleteItem);
router.delete("/", bulkDeleteItems);

export default router;
