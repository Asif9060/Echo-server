import { Response } from "express";
import Category from "../models/Category";
import Item from "../models/Item";
import { AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

// Get all categories with pagination and search
export const getCategories = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const {
         page = 1,
         limit = 10,
         search = "",
         status = "",
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

      if (status) {
         query.status = status;
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sort as string] = order === "asc" ? 1 : -1;

      // Get categories with pagination
      const [categories, total] = await Promise.all([
         Category.find(query).sort(sortObj).skip(skip).limit(limitNum).lean(),
         Category.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
         success: true,
         data: {
            categories,
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
      logger.error("Get categories error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Get single category by ID
export const getCategory = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
         res.status(404).json({
            success: false,
            message: "Category not found",
         });
         return;
      }

      res.status(200).json({
         success: true,
         data: { category },
      });
   } catch (error) {
      logger.error("Get category error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Create new category
export const createCategory = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { name, slug, description, icon, gradient, status, sortOrder } = req.body;

      // Check if slug already exists
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
         res.status(400).json({
            success: false,
            message: "Category with this slug already exists",
         });
         return;
      }

      const category = new Category({
         name,
         slug,
         description,
         icon,
         gradient,
         status,
         sortOrder,
      });

      await category.save();

      res.status(201).json({
         success: true,
         message: "Category created successfully",
         data: { category },
      });
   } catch (error) {
      logger.error("Create category error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;
      const { name, slug, description, icon, gradient, status, sortOrder } = req.body;

      // Check if slug is taken by another category
      if (slug) {
         const existingCategory = await Category.findOne({
            slug,
            _id: { $ne: id },
         });

         if (existingCategory) {
            res.status(400).json({
               success: false,
               message: "Category with this slug already exists",
            });
            return;
         }
      }

      const category = await Category.findByIdAndUpdate(
         id,
         {
            name,
            slug,
            description,
            icon,
            gradient,
            status,
            sortOrder,
         },
         { new: true, runValidators: true }
      );

      if (!category) {
         res.status(404).json({
            success: false,
            message: "Category not found",
         });
         return;
      }

      res.status(200).json({
         success: true,
         message: "Category updated successfully",
         data: { category },
      });
   } catch (error) {
      logger.error("Update category error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Delete category
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { id } = req.params;

      // Check if category has items
      const itemCount = await Item.countDocuments({ category: id });
      if (itemCount > 0) {
         res.status(400).json({
            success: false,
            message: `Cannot delete category. It has ${itemCount} items. Please move or delete items first.`,
         });
         return;
      }

      const category = await Category.findByIdAndDelete(id);
      if (!category) {
         res.status(404).json({
            success: false,
            message: "Category not found",
         });
         return;
      }

      res.status(200).json({
         success: true,
         message: "Category deleted successfully",
      });
   } catch (error) {
      logger.error("Delete category error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Update category item count
export const updateCategoryItemCount = async (categoryId: string): Promise<void> => {
   try {
      const itemCount = await Item.countDocuments({
         category: categoryId,
         status: "active",
      });

      await Category.findByIdAndUpdate(categoryId, { itemCount });
   } catch (error) {
      logger.error("Update category item count error:", error);
   }
};

// Get category statistics
export const getCategoryStats = async (
   _req: AuthRequest,
   res: Response
): Promise<void> => {
   try {
      const stats = await Category.aggregate([
         {
            $lookup: {
               from: "items",
               localField: "_id",
               foreignField: "category",
               as: "items",
            },
         },
         {
            $project: {
               name: 1,
               slug: 1,
               status: 1,
               totalItems: { $size: "$items" },
               activeItems: {
                  $size: {
                     $filter: {
                        input: "$items",
                        cond: { $eq: ["$$this.status", "active"] },
                     },
                  },
               },
               draftItems: {
                  $size: {
                     $filter: {
                        input: "$items",
                        cond: { $eq: ["$$this.status", "draft"] },
                     },
                  },
               },
            },
         },
         {
            $sort: { name: 1 },
         },
      ]);

      res.status(200).json({
         success: true,
         data: { stats },
      });
   } catch (error) {
      logger.error("Get category stats error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};
