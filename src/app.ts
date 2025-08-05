import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import connectDB from "./config/database";
import { logger } from "./utils/logger";
import { apiLimiter } from "./middleware/rateLimit";

// Import routes
import authRoutes from "./routes/auth";
import categoryRoutes from "./routes/categories";
import itemRoutes from "./routes/items";

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(
   helmet({
      contentSecurityPolicy: {
         directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
         },
      },
   })
);

// CORS configuration
app.use(
   cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      optionsSuccessStatus: 200,
   })
);

// Rate limiting
app.use("/api/", apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
   app.use(morgan("combined", { stream: { write: (msg) => logger.info(msg.trim()) } }));
} else {
   app.use(morgan("combined"));
}

// Static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", (_req, res) => {
   res.status(200).json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
   });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/items", itemRoutes);

// Serve React app in production
if (process.env.NODE_ENV === "production") {
   app.use(express.static(path.join(__dirname, "../../dist")));

   app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "../../dist/index.html"));
   });
}

// 404 handler
app.use("*", (req, res) => {
   res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
   });
});

// Global error handler
app.use(
   (
      err: any,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
   ): void => {
      logger.error("Unhandled error:", err);

      // Mongoose validation error
      if (err.name === "ValidationError") {
         const errors = Object.values(err.errors).map((val: any) => val.message);
         res.status(400).json({
            success: false,
            message: "Validation error",
            errors,
         });
         return;
      }

      // Mongoose duplicate key error
      if (err.code === 11000) {
         const field = Object.keys(err.keyValue)[0];
         res.status(400).json({
            success: false,
            message: `${field} already exists`,
         });
         return;
      }

      // JWT errors
      if (err.name === "JsonWebTokenError") {
         res.status(401).json({
            success: false,
            message: "Invalid token",
         });
         return;
      }

      if (err.name === "TokenExpiredError") {
         res.status(401).json({
            success: false,
            message: "Token expired",
         });
         return;
      }

      // Default error
      res.status(err.statusCode || 500).json({
         success: false,
         message: err.message || "Internal server error",
      });
   }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
   logger.info(
      `Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`
   );
});

export default app;
