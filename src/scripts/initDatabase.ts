import mongoose from "mongoose";
import Admin from "../models/Admin";
import Category from "../models/Category";
import { logger } from "../utils/logger";

const initializeDatabase = async () => {
   try {
      // Connect to MongoDB
      await mongoose.connect(
         process.env.MONGODB_URI || "mongodb://localhost:27017/entertainment-hub"
      );
      logger.info("Connected to MongoDB");

      // Create default admin user
      const adminEmail = process.env.ADMIN_EMAIL || "admin@entertainmenthub.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const adminUsername = process.env.ADMIN_USERNAME || "admin";

      const existingAdmin = await Admin.findOne({ email: adminEmail });

      if (!existingAdmin) {
         const admin = new Admin({
            username: adminUsername,
            email: adminEmail,
            password: adminPassword,
            role: "super_admin",
         });

         await admin.save();
         logger.info(`Default admin created with email: ${adminEmail}`);
      } else {
         logger.info("Default admin already exists");
      }

      // Create default categories
      const defaultCategories = [
         {
            name: "Movies",
            slug: "movies",
            description: "Discover blockbuster hits and indie gems",
            icon: "🎬",
            gradient: "from-red-500 to-pink-600",
            status: "active",
            sortOrder: 1,
         },
         {
            name: "TV Series",
            slug: "series",
            description: "Binge-worthy shows and limited series",
            icon: "📺",
            gradient: "from-blue-500 to-purple-600",
            status: "active",
            sortOrder: 2,
         },
         {
            name: "Anime",
            slug: "anime",
            description: "Japanese animation and manga adaptations",
            icon: "🗾",
            gradient: "from-green-500 to-teal-600",
            status: "active",
            sortOrder: 3,
         },
         {
            name: "Games",
            slug: "games",
            description: "Gaming content and reviews",
            icon: "🎮",
            gradient: "from-orange-500 to-red-600",
            status: "active",
            sortOrder: 4,
         },
      ];

      for (const categoryData of defaultCategories) {
         const existingCategory = await Category.findOne({ slug: categoryData.slug });

         if (!existingCategory) {
            const category = new Category(categoryData);
            await category.save();
            logger.info(`Created category: ${categoryData.name}`);
         }
      }

      logger.info("Database initialization completed successfully");
      process.exit(0);
   } catch (error) {
      logger.error("Database initialization failed:", error);
      process.exit(1);
   }
};

// Run initialization if this file is executed directly
if (require.main === module) {
   initializeDatabase();
}

export default initializeDatabase;
