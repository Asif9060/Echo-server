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
} from "../controllers/itemController";
import {
   validateItem,
   validateItemRelaxed,
   validatePagination,
   validateObjectId,
   validateSearch,
   handleValidationErrors,
} from "../middleware/validation";
import { createLimiter } from "../middleware/rateLimit";

const router = express.Router();

// All routes are now public (no authentication required)
router.get("/", validatePagination, validateSearch, handleValidationErrors, getItems);
router.get("/stats", getItemStats);
router.get("/:id", validateObjectId, handleValidationErrors, getItem);

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
