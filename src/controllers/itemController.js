import Item from "../models/Item.js";
import Category from "../models/Category.js";
import { logger } from "../utils/logger.js";
import { updateCategoryItemCount } from "./categoryController.js";
import { upload, deleteImage, extractPublicId } from "../config/cloudinary.js";

// Upload image to Cloudinary
export const uploadImage = async (req, res) => {
   try {
      if (!req.file) {
         return res.status(400).json({
            success: false,
            message: "No image file provided",
         });
      }

      return res.status(200).json({
         success: true,
         message: "Image uploaded successfully",
         url: req.file.path, // Frontend expects this field
         data: {
            imageUrl: req.file.path,
            publicId: req.file.filename,
         },
      });
   } catch (error) {
      logger.error("Error uploading image:", error);
      return res.status(500).json({
         success: false,
         message: "Error uploading image",
         error: error.message,
      });
   }
};

// Get all items with pagination, search, and filters
export const getItems = async (req, res) => {
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

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build query
      const query = {};

      if (search) {
         query.$text = { $search: search };
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
      const sortObj = {};
      sortObj[sort] = order === "asc" ? 1 : -1;

      // Get items with pagination and populate category
      const [items, total] = await Promise.all([
         Item.find(query)
            .populate("category", "name slug")
            .sort(sortObj)
            .skip(skip)
            .limit(limitNum)
            .lean(),
         Item.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      // Transform items to standardized format
      const transformedItems = items.map((item) => ({
         _id: item._id,
         title: item.title,
         description: item.description,
         releaseDate: item.releaseDate,
         developer: item.developer,
         platforms: item.platforms,
         genres: item.genres,
         keyFeatures: item.keyFeatures,
         storySummary: item.storySummary,
         highlights: item.highlights,
         authorReview: item.authorReview,
         screenshots: item.screenshots,
         soundtrackLinks: item.soundtrackLinks,
         ratings: item.ratings,
         characters: item.characters,
         slug: item.slug,
         category: item.category,
         status: item.status,
         createdAt: item.createdAt,
         updatedAt: item.updatedAt,
      }));

      res.status(200).json({
         success: true,
         data: {
            items: transformedItems,
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
export const getItem = async (req, res) => {
   try {
      const { id } = req.params;

      const item = await Item.findById(id).populate("category", "name slug");

      if (!item) {
         res.status(404).json({
            success: false,
            message: "Item not found",
         });
         return;
      }

      // Transform to standardized format
      const transformedItem = {
         _id: item._id,
         title: item.title,
         description: item.description,
         releaseDate: item.releaseDate,
         developer: item.developer,
         platforms: item.platforms,
         genres: item.genres,
         keyFeatures: item.keyFeatures,
         storySummary: item.storySummary,
         highlights: item.highlights,
         authorReview: item.authorReview,
         screenshots: item.screenshots,
         soundtrackLinks: item.soundtrackLinks,
         ratings: item.ratings,
         characters: item.characters,
         slug: item.slug,
         category: item.category,
         status: item.status,
         createdAt: item.createdAt,
         updatedAt: item.updatedAt,
      };

      res.status(200).json({
         success: true,
         data: { item: transformedItem },
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
export const createItem = async (req, res) => {
   try {
      // Destructure all prompt fields
      const {
         title,
         description,
         releaseDate,
         developer,
         platforms,
         genres,
         keyFeatures,
         storySummary,
         highlights,
         authorReview,
         screenshots,
         soundtrackLinks,
         ratings,
         characters,
         slug,
         category,
         status,
      } = req.body;

      // Only validate category is provided (required for organization)
      if (!category) {
         return res.status(400).json({
            success: false,
            message: "Category is required.",
         });
      }

      // Optional validation for data quality (only when fields are provided)
      if (characters && Array.isArray(characters)) {
         for (const char of characters) {
            if (char.description && char.description.length > 300) {
               return res.status(400).json({
                  success: false,
                  message: "Character description must be 300 characters or less.",
               });
            }
         }
      }

      // Auto-generate slug from title if not provided
      let itemSlug = slug;
      if (!itemSlug && title) {
         itemSlug = title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
      }
      if (!itemSlug) {
         return res
            .status(400)
            .json({ success: false, message: "Title is required to generate slug" });
      }

      // Verify category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
         return res.status(400).json({ success: false, message: "Category not found" });
      }

      // Make slug unique if it already exists
      let uniqueSlug = itemSlug;
      let counter = 1;
      while (await Item.findOne({ slug: uniqueSlug })) {
         uniqueSlug = `${itemSlug}-${counter}`;
         counter++;
      }

      const item = new Item({
         title,
         description,
         releaseDate,
         developer,
         platforms,
         genres,
         keyFeatures,
         storySummary,
         highlights,
         authorReview,
         screenshots,
         soundtrackLinks,
         ratings,
         characters: characters || [],
         slug: uniqueSlug,
         category,
         status: status || "draft",
      });

      await item.save();
      await updateCategoryItemCount(category);
      await item.populate("category", "name slug");

      // Transform to standardized format
      const transformedItem = {
         _id: item._id,
         title: item.title,
         description: item.description,
         releaseDate: item.releaseDate,
         developer: item.developer,
         platforms: item.platforms,
         genres: item.genres,
         keyFeatures: item.keyFeatures,
         storySummary: item.storySummary,
         highlights: item.highlights,
         authorReview: item.authorReview,
         screenshots: item.screenshots,
         soundtrackLinks: item.soundtrackLinks,
         ratings: item.ratings,
         characters: item.characters,
         slug: item.slug,
         category: item.category,
         status: item.status,
         createdAt: item.createdAt,
         updatedAt: item.updatedAt,
      };

      res.status(201).json({
         success: true,
         message: "Item created successfully",
         data: { item: transformedItem },
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
export const updateItem = async (req, res) => {
   try {
      const { id } = req.params;
      const {
         title,
         description,
         releaseDate,
         developer,
         platforms,
         genres,
         keyFeatures,
         storySummary,
         highlights,
         authorReview,
         screenshots,
         soundtrackLinks,
         ratings,
         characters,
         slug,
         category,
         status,
      } = req.body;

      // Optional validation for data quality (only when fields are provided)
      if (characters && Array.isArray(characters)) {
         for (const char of characters) {
            if (char.description && char.description.length > 300) {
               return res.status(400).json({
                  success: false,
                  message: "Character description must be 300 characters or less.",
               });
            }
         }
      }

      // Get current item to check category change
      const currentItem = await Item.findById(id);
      if (!currentItem) {
         return res.status(404).json({ success: false, message: "Item not found" });
      }

      // Auto-generate slug from title if not provided
      let itemSlug = slug;
      if (!itemSlug && title) {
         itemSlug = title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
      }
      if (!itemSlug) itemSlug = currentItem.slug;

      // Verify category exists if provided
      if (category && category !== currentItem.category.toString()) {
         const categoryExists = await Category.findById(category);
         if (!categoryExists) {
            return res
               .status(400)
               .json({ success: false, message: "Category not found" });
         }
      }

      // Check if slug is taken by another item
      if (itemSlug && itemSlug !== currentItem.slug) {
         const existingItem = await Item.findOne({ slug: itemSlug, _id: { $ne: id } });
         if (existingItem) {
            return res
               .status(400)
               .json({ success: false, message: "Item with this slug already exists" });
         }
      }

      const oldCategory = currentItem.category;

      // Prepare update data with proper handling for optional fields
      const updateData = {
         title,
         description,
         releaseDate,
         developer,
         platforms,
         genres,
         keyFeatures,
         storySummary,
         highlights,
         authorReview,
         screenshots,
         soundtrackLinks,
         characters: characters || [],
         slug: itemSlug,
         category,
         status,
      };

      // Handle ratings specially - allow clearing/removing ratings
      if (ratings !== undefined) {
         if (ratings === null || Object.keys(ratings || {}).length === 0) {
            updateData.ratings = undefined; // Clear ratings completely
         } else {
            updateData.ratings = ratings;
         }
      }

      const item = await Item.findByIdAndUpdate(id, updateData, {
         new: true,
         runValidators: true,
      }).populate("category", "name slug");

      if (!item) {
         return res.status(404).json({ success: false, message: "Item not found" });
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

      // Transform to standardized format
      const transformedItem = {
         _id: item._id,
         title: item.title,
         description: item.description,
         releaseDate: item.releaseDate,
         developer: item.developer,
         platforms: item.platforms,
         genres: item.genres,
         keyFeatures: item.keyFeatures,
         storySummary: item.storySummary,
         highlights: item.highlights,
         authorReview: item.authorReview,
         screenshots: item.screenshots,
         soundtrackLinks: item.soundtrackLinks,
         ratings: item.ratings,
         characters: item.characters,
         slug: item.slug,
         category: item.category,
         status: item.status,
         createdAt: item.createdAt,
         updatedAt: item.updatedAt,
      };

      res.status(200).json({
         success: true,
         message: "Item updated successfully",
         data: { item: transformedItem },
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
export const deleteItem = async (req, res) => {
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
export const bulkDeleteItems = async (req, res) => {
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
export const updateItemStatus = async (req, res) => {
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
export const getItemStats = async (_req, res) => {
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
