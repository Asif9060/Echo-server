import { body, validationResult, param, query } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
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

// Category validation rules
export const validateCategory = [
   body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Category name must be between 1 and 100 characters"),

   body("slug")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Slug must be between 1 and 100 characters")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug can only contain lowercase letters, numbers, and hyphens"),

   body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),

   body("icon")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Icon cannot exceed 50 characters"),

   body("image").optional().trim().isURL().withMessage("Image must be a valid URL"),

   body("status")
      .optional()
      .isIn(["active", "inactive"])
      .withMessage("Status must be either active or inactive"),
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

   body("releaseDate").isISO8601().withMessage("Release date must be a valid date"),

   body("developer")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Developer must be between 1 and 100 characters"),

   body("platforms").isArray({ min: 1 }).withMessage("At least one platform is required"),

   body("genres").isArray({ min: 1 }).withMessage("At least one genre is required"),

   body("authorReview")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Author review is required"),

   body("screenshots")
      .isArray({ min: 3 })
      .withMessage("At least 3 screenshots are required"),

   body("ratings.story")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Story rating must be between 1 and 5"),

   body("ratings.graphics")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Graphics rating must be between 1 and 5"),

   body("ratings.gameplay")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Gameplay rating must be between 1 and 5"),

   body("ratings.replayability")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Replayability rating must be between 1 and 5"),

   body("category").isMongoId().withMessage("Category must be a valid MongoDB ObjectId"),

   body("status")
      .optional()
      .isIn(["active", "inactive", "draft"])
      .withMessage("Status must be either active, inactive, or draft"),
];

// Validation for updating items
export const validateItemUpdate = [
   body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be between 1 and 200 characters"),

   body("description")
      .trim()
      .isLength({ min: 1, max: 2000 })
      .withMessage("Description must be between 1 and 2000 characters"),

   body("releaseDate").isISO8601().withMessage("Release date must be a valid date"),

   body("developer")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Developer must be between 1 and 100 characters"),

   body("platforms").isArray({ min: 1 }).withMessage("At least one platform is required"),

   body("genres").isArray({ min: 1 }).withMessage("At least one genre is required"),

   body("authorReview")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Author review is required"),

   body("screenshots")
      .isArray({ min: 3 })
      .withMessage("At least 3 screenshots are required"),

   body("ratings.story")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Story rating must be between 1 and 5"),

   body("ratings.graphics")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Graphics rating must be between 1 and 5"),

   body("ratings.gameplay")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Gameplay rating must be between 1 and 5"),

   body("ratings.replayability")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Replayability rating must be between 1 and 5"),

   body("category").isMongoId().withMessage("Category must be a valid MongoDB ObjectId"),

   body("status")
      .optional()
      .isIn(["active", "inactive", "draft"])
      .withMessage("Status must be either active, inactive, or draft"),
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
      .isIn(["name", "createdAt", "updatedAt", "-name", "-createdAt", "-updatedAt"])
      .withMessage(
         "Sort must be one of: name, createdAt, updatedAt (with optional - prefix for descending)"
      ),
];

// Search validation
export const validateSearch = [
   query("search")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Search query must be between 1 and 100 characters"),

   query("status")
      .optional()
      .isIn(["active", "inactive", "draft"])
      .withMessage("Status filter must be one of: active, inactive, draft"),

   query("type")
      .optional()
      .isIn(["movie", "series", "anime", "game", "book", "music"])
      .withMessage("Type filter must be one of: movie, series, anime, game, book, music"),

   query("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured filter must be a boolean"),
];

// MongoDB ObjectId validation
export const validateObjectId = [
   param("id").isMongoId().withMessage("ID must be a valid MongoDB ObjectId"),
];

// Bulk operations validation
export const validateBulkDelete = [
   body("ids")
      .isArray({ min: 1 })
      .withMessage("IDs array must contain at least one item"),

   body("ids.*").isMongoId().withMessage("Each ID must be a valid MongoDB ObjectId"),
];

// Status update validation
export const validateStatusUpdate = [
   body("status")
      .isIn(["active", "inactive", "draft"])
      .withMessage("Status must be one of: active, inactive, draft"),
];
