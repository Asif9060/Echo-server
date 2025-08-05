import { Response } from "express";
import Item from "../models/Item";
import Category from "../models/Category";
import { AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";
import { updateCategoryItemCount } from "./categoryController";

// Get all items with pagination, search, and filters
export const getItems = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const {
         page = 1,
         limit = 10,
         search = "",
         category = "",
         status = "",
         featured = "",
         sort = "createdAt",
         order = "desc",
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query: any = {};

      if (search) {
         query.$text = { $search: search as string };
      }

      if (category) {
         query.category = category;
      }

      if (status) {
         query.status = status;
      }

      if (featured !== "") {
         query.featured = featured === "true";
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sort as string] = order === "asc" ? 1 : -1;

      // Get items with pagination and populate category
      const [items, total] = await Promise.all([
         Item.find(query)
            .populate("category", "name slug")
            .populate("createdBy", "username")
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean(),
         Item.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
         success: true,
         data: {
            items,
            pagination: {
               current: pageNum,
               pages: totalPages,
               total,
               limit: limitNum,
               hasNext: pageNum < totalPages,
               hasPrev: pageNum > 1,
            },
         },
      });
   } catch (error) {
      logger.error("Get items error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Get single item by ID
export const getItem = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;

      const item = await Item.findById(id)
         .populate("category", "name slug")
         .populate("createdBy", "username email");

      if (!item) {
         res.status(404).json({
            success: false,
            message: "Item not found",
         });
         return;
      }

      res.status(200).json({
         success: true,
         data: { item },
      });
   } catch (error) {
      logger.error("Get item error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Create new item
export const createItem = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const {
         title,
         slug,
         description,
         category,
         images,
         thumbnail,
         status,
         featured,
         rating,
         tags,
         metadata,
         sortOrder,
      } = req.body;

      // Verify category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
         res.status(400).json({
            success: false,
            message: "Category not found",
         });
         return;
      }

      // Check if slug already exists
      const existingItem = await Item.findOne({ slug });
      if (existingItem) {
         res.status(400).json({
            success: false,
            message: "Item with this slug already exists",
         });
         return;
      }

      const item = new Item({
         title,
         slug,
         description,
         category,
         images,
         thumbnail,
         status,
         featured,
         rating,
         tags,
         metadata,
         sortOrder,
         createdBy: req.admin?._id,
      });

      await item.save();

      // Update category item count
      await updateCategoryItemCount(category);

      // Populate the response
      await item.populate("category", "name slug");
      await item.populate("createdBy", "username");

      res.status(201).json({
         success: true,
         message: "Item created successfully",
         data: { item },
      });
   } catch (error) {
      logger.error("Create item error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Update item
export const updateItem = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;
      const {
         title,
         slug,
         description,
         category,
         images,
         thumbnail,
         status,
         featured,
         rating,
         tags,
         metadata,
         sortOrder,
      } = req.body;

      // Get current item to check category change
      const currentItem = await Item.findById(id);
      if (!currentItem) {
         res.status(404).json({
            success: false,
            message: "Item not found",
         });
         return;
      }

      // Verify category exists if provided
      if (category && category !== currentItem.category.toString()) {
         const categoryExists = await Category.findById(category);
         if (!categoryExists) {
            res.status(400).json({
               success: false,
               message: "Category not found",
            });
            return;
         }
      }

      // Check if slug is taken by another item
      if (slug && slug !== currentItem.slug) {
         const existingItem = await Item.findOne({
            slug,
            _id: { $ne: id },
         });

         if (existingItem) {
            res.status(400).json({
               success: false,
               message: "Item with this slug already exists",
            });
            return;
         }
      }

      const oldCategory = currentItem.category;

      const item = await Item.findByIdAndUpdate(
         id,
         {
            title,
            slug,
            description,
            category,
            images,
            thumbnail,
            status,
            featured,
            rating,
            tags,
            metadata,
            sortOrder,
         },
         { new: true, runValidators: true }
      )
         .populate("category", "name slug")
         .populate("createdBy", "username");

      if (!item) {
         res.status(404).json({
            success: false,
            message: "Item not found",
         });
         return;
      }

      // Update category item counts if category changed
      if (category && category !== oldCategory.toString()) {
         await Promise.all([
            updateCategoryItemCount(oldCategory.toString()),
            updateCategoryItemCount(category),
         ]);
      } else {
         await updateCategoryItemCount(oldCategory.toString());
      }

      res.status(200).json({
         success: true,
         message: "Item updated successfully",
         data: { item },
      });
   } catch (error) {
      logger.error("Update item error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Delete item
export const deleteItem = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;

      const item = await Item.findByIdAndDelete(id);
      if (!item) {
         res.status(404).json({
            success: false,
            message: "Item not found",
         });
         return;
      }

      // Update category item count
      await updateCategoryItemCount(item.category.toString());

      res.status(200).json({
         success: true,
         message: "Item deleted successfully",
      });
   } catch (error) {
      logger.error("Delete item error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Bulk delete items
export const bulkDeleteItems = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
         res.status(400).json({
            success: false,
            message: "Please provide an array of item IDs",
         });
         return;
      }

      // Get items to find their categories
      const items = await Item.find({ _id: { $in: ids } });
      const categoryIds = [...new Set(items.map((item) => item.category.toString()))];

      // Delete items
      const result = await Item.deleteMany({ _id: { $in: ids } });

      // Update category item counts
      await Promise.all(
         categoryIds.map((categoryId) => updateCategoryItemCount(categoryId))
      );

      res.status(200).json({
         success: true,
         message: `${result.deletedCount} items deleted successfully`,
      });
   } catch (error) {
      logger.error("Bulk delete items error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Update item status
export const updateItemStatus = async (
   req: AuthRequest,
   res: Response
): Promise<void> => {
   try {
      const { id } = req.params;
      const { status } = req.body;

      const item = await Item.findByIdAndUpdate(
         id,
         { status },
         { new: true, runValidators: true }
      ).populate("category", "name slug");

      if (!item) {
         res.status(404).json({
            success: false,
            message: "Item not found",
         });
         return;
      }

      // Update category item count
      await updateCategoryItemCount(item.category._id.toString());

      res.status(200).json({
         success: true,
         message: "Item status updated successfully",
         data: { item },
      });
   } catch (error) {
      logger.error("Update item status error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Get item statistics
export const getItemStats = async (_req: AuthRequest, res: Response): Promise<void> => {
   try {
      const stats = await Item.aggregate([
         {
            $group: {
               _id: null,
               total: { $sum: 1 },
               active: {
                  $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
               },
               inactive: {
                  $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] },
               },
               draft: {
                  $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
               },
               featured: {
                  $sum: { $cond: ["$featured", 1, 0] },
               },
               averageRating: { $avg: "$rating" },
               totalViews: { $sum: "$viewCount" },
            },
         },
      ]);

      const categoryStats = await Item.aggregate([
         {
            $group: {
               _id: "$category",
               count: { $sum: 1 },
            },
         },
         {
            $lookup: {
               from: "categories",
               localField: "_id",
               foreignField: "_id",
               as: "category",
            },
         },
         {
            $unwind: "$category",
         },
         {
            $project: {
               name: "$category.name",
               slug: "$category.slug",
               count: 1,
            },
         },
         {
            $sort: { count: -1 },
         },
      ]);

      res.status(200).json({
         success: true,
         data: {
            overview: stats[0] || {
               total: 0,
               active: 0,
               inactive: 0,
               draft: 0,
               featured: 0,
               averageRating: 0,
               totalViews: 0,
            },
            byCategory: categoryStats,
         },
      });
   } catch (error) {
      logger.error("Get item stats error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};
