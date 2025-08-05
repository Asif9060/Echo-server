import { Request, Response, NextFunction } from "express";
import { body, validationResult, param, query } from "express-validator";

export const handleValidationErrors = (
   req: Request,
   res: Response,
   next: NextFunction
): void => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      res.status(400).json({
         success: false,
         message: "Validation failed",
         errors: errors.array(),
      });
      return;
   }
   next();
};

// Admin validation rules
export const validateAdminRegistration = [
   body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username can only contain letters, numbers, and underscores"),

   body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

   body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
         "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),

   body("role")
      .optional()
      .isIn(["admin", "super_admin"])
      .withMessage("Role must be either admin or super_admin"),
];

export const validateAdminLogin = [
   body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email address"),

   body("password").notEmpty().withMessage("Password is required"),
];

// Category validation rules
export const validateCategory = [
   body("name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Category name must be between 1 and 50 characters"),

   body("description")
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("Description must be between 1 and 500 characters"),

   body("slug")
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug can only contain lowercase letters, numbers, and hyphens"),

   body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Status must be either active or inactive"),

   body("sortOrder")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Sort order must be a non-negative integer"),
];

// Item validation rules
export const validateItem = [
   body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be between 1 and 200 characters"),

   body("description")
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Description must be between 1 and 2000 characters"),

   body("slug")
      .trim()
      .isLength({ min: 1, max: 200 })
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug can only contain lowercase letters, numbers, and hyphens"),

   body("category").isMongoId().withMessage("Category must be a valid MongoDB ObjectId"),

   body("status")
      .optional()
      .isIn(["active", "inactive", "draft"])
      .withMessage("Status must be active, inactive, or draft"),

   body("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean value"),

   body("rating")
      .optional()
      .isFloat({ min: 0, max: 10 })
      .withMessage("Rating must be between 0 and 10"),

   body("tags").optional().isArray().withMessage("Tags must be an array"),

   body("tags.*")
      .optional()
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage("Each tag must be between 1 and 30 characters"),
];

// Pagination validation
export const validatePagination = [
   query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),

   query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1 and 100"),

   query("sort")
      .optional()
      .isIn(["name", "createdAt", "updatedAt", "title", "rating", "viewCount"])
      .withMessage("Invalid sort field"),

   query("order")
      .optional()
      .isIn(["asc", "desc"])
      .withMessage("Order must be asc or desc"),
];

// MongoDB ObjectId validation
export const validateObjectId = [
   param("id").isMongoId().withMessage("Invalid ID format"),
];

// Search validation
export const validateSearch = [
   query("q")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Search query must be between 1 and 100 characters"),

   query("category")
      .optional()
      .isMongoId()
      .withMessage("Category must be a valid MongoDB ObjectId"),

   query("status")
      .optional()
      .isIn(["active", "inactive", "draft"])
      .withMessage("Status must be active, inactive, or draft"),

   query("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean value"),
];
