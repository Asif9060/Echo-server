import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

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

// Strict rate limit for authentication endpoints
export const authLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 minutes
   max: 5, // limit each IP to 5 requests per windowMs
   message: {
      success: false,
      message: "Too many authentication attempts, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
   skipSuccessfulRequests: true, // Don't count successful requests
});

// Upload rate limit
export const uploadLimiter = rateLimit({
   windowMs: 60 * 60 * 1000, // 1 hour
   max: 20, // limit each IP to 20 uploads per hour
   message: {
      success: false,
      message: "Too many upload requests, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Create item rate limit
export const createLimiter = rateLimit({
   windowMs: 60 * 60 * 1000, // 1 hour
   max: 50, // limit each IP to 50 create requests per hour
   message: {
      success: false,
      message: "Too many create requests, please try again later.",
   },
   standardHeaders: true,
   legacyHeaders: false,
});

// Custom rate limiter with Redis store (optional for production)
export const createCustomLimiter = (windowMs: number, max: number, message: string) => {
   return rateLimit({
      windowMs,
      max,
      message: {
         success: false,
         message,
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req: Request, res: Response) => {
         res.status(429).json({
            success: false,
            message,
            retryAfter: Math.round(windowMs / 1000),
         });
      },
   });
};
