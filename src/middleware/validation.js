import { body, validationResult, param, query } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      const fieldErrors = errors
         .array()
         .map((e) => ({ field: e.param, message: e.msg, value: e.value }));
      res.status(400).json({
         success: false,
         message: "Validation failed",
         errors: fieldErrors,
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

// Relaxed Item validation rules: only category required; others optional if present
export const validateItemRelaxed = [
   body("category")
      .exists({ checkFalsy: true })
      .withMessage("Category is required")
      .bail()
      .isMongoId()
      .withMessage("Category must be a valid MongoDB ObjectId"),

   body("title")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Title cannot exceed 200 characters"),
   body("description")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Description cannot exceed 2000 characters"),
   body("releaseDate")
      .optional()
      .isISO8601()
      .withMessage("Release date must be a valid date"),
   body("developer")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Developer cannot exceed 100 characters"),

   body("platforms").optional().isArray().withMessage("Platforms must be an array"),
   body("platforms.*")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Platform entries cannot be empty"),

   body("genres").optional().isArray().withMessage("Genres must be an array"),
   body("genres.*")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Genre entries cannot be empty"),

   body("keyFeatures").optional().isArray().withMessage("Key features must be an array"),
   body("keyFeatures.*")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Key feature entries cannot be empty"),

   body("highlights").optional().isArray().withMessage("Highlights must be an array"),
   body("highlights.*")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Highlight entries cannot be empty"),

   body("authorReview").optional().trim(),

   body("screenshots").optional().isArray().withMessage("Screenshots must be an array"),
   body("screenshots.*")
      .optional()
      .isString()
      .withMessage("Screenshot URLs must be strings"),

   body("soundtrackLinks")
      .optional()
      .isArray()
      .withMessage("Soundtrack links must be an array"),
   body("soundtrackLinks.*")
      .optional()
      .isURL({ protocols: ["http", "https"], require_protocol: true })
      .withMessage("All soundtrack links must be valid URLs"),

   body("ratings").optional().isObject().withMessage("Ratings must be an object"),
   body("ratings.story")
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage("Story rating must be between 1 and 5"),
   body("ratings.graphics")
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage("Graphics rating must be between 1 and 5"),
   body("ratings.gameplay")
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage("Gameplay rating must be between 1 and 5"),
   body("ratings.replayability")
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage("Replayability rating must be between 1 and 5"),

   body("characters").optional().isArray().withMessage("Characters must be an array"),
   body("characters.*.name")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Character name cannot exceed 100 characters"),
   body("characters.*.description")
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage("Character description must be 300 characters or less"),
   body("characters.*.image")
      .optional()
      .isString()
      .withMessage("Character image must be a string"),

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
