import rateLimit from "express-rate-limit";

// General API rate limit
export const apiLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 100, // limit each IP to 100 requests per windowMs
   message: {
      success: false,
      message: "Too many requests from this IP, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Upload rate limit
export const uploadLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 10, // limit each IP to 10 uploads per windowMs
   message: {
      success: false,
      message: "Too many upload attempts, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Create operation rate limit
export const createLimiter = rateLimit({
   windowMs: 5 * 60 * 1000, // 5 minutes
   max: 20, // limit each IP to 20 create operations per windowMs
   message: {
      success: false,
      message: "Too many create operations, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Update operation rate limit
export const updateLimiter = rateLimit({
   windowMs: 5 * 60 * 1000, // 5 minutes
   max: 30, // limit each IP to 30 update operations per windowMs
   message: {
      success: false,
      message: "Too many update operations, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Delete operation rate limit
export const deleteLimiter = rateLimit({
   windowMs: 10 * 60 * 1000, // 10 minutes
   max: 10, // limit each IP to 10 delete operations per windowMs
   message: {
      success: false,
      message: "Too many delete operations, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
});
