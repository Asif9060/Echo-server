import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/database.js";
import { logger } from "./utils/logger.js";
import { apiLimiter } from "./middleware/rateLimit.js";

// Import routes
import categoryRoutes from "./routes/categories.js";
import itemRoutes from "./routes/items.js";

// Import upload functionality
import { upload } from "./config/cloudinary.js";
import { uploadImage } from "./controllers/itemController.js";

// ES module __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const allowedOrigins = [
   "https://echo-eight-ruddy.vercel.app",
   "http://localhost:5173", // For development
   "http://localhost:3000", // Alternative dev port
];

// Add environment-specific origin if available
if (process.env.FRONTEND_URL) {
   const frontendUrl = process.env.FRONTEND_URL.replace(/\/$/, ""); // Remove trailing slash
   if (!allowedOrigins.includes(frontendUrl)) {
      allowedOrigins.push(frontendUrl);
   }
}

app.use(
   cors({
      origin: function (origin, callback) {
         // Allow requests with no origin (like mobile apps or curl requests)
         if (!origin) return callback(null, true);

         if (allowedOrigins.includes(origin)) {
            logger.info(`CORS allowed origin: ${origin}`);
            return callback(null, true);
         } else {
            logger.error(
               `CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(
                  ", "
               )}`
            );
            return callback(new Error("Not allowed by CORS"));
         }
      },
      credentials: true,
      optionsSuccessStatus: 200,
   })
);

// Rate limiting
app.use("/api", apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
app.use(
   morgan("combined", {
      stream: {
         write: (message) => logger.info(message.trim()),
      },
      skip: (req, res) => res.statusCode < 400,
   })
);

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API routes
app.use("/api/categories", categoryRoutes);
app.use("/api/items", itemRoutes);

// General upload endpoint
app.post("/api/upload", upload.single("image"), uploadImage);

// Health check endpoint
app.get("/api/health", (req, res) => {
   res.json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
   });
});

// Error handling middleware
app.use((err, req, res, next) => {
   logger.error("Error:", {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
   });

   // Don't leak error details in production
   const message =
      process.env.NODE_ENV === "production" ? "Internal server error" : err.message;

   res.status(err.status || 500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
   });
});

// 404 handler
app.use("*", (req, res) => {
   res.status(404).json({
      success: false,
      message: "Route not found",
   });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
   logger.info(`Server running on http://${HOST}:${PORT}`);
   logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;
