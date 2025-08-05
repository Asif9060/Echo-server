import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
   cloudinary: cloudinary,
   params: {
      folder: "doingSomething/items", // Folder name in Cloudinary
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [
         { width: 800, height: 600, crop: "limit" }, // Resize images to max 800x600
         { quality: "auto" }, // Auto optimize quality
         { format: "auto" }, // Auto format selection
      ],
   },
});

// Create multer upload middleware
const upload = multer({
   storage: storage,
   limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
   },
   fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
         cb(null, true);
      } else {
         cb(new Error("Only image files are allowed"), false);
      }
   },
});

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
   try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
   } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
      throw error;
   }
};

// Function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
   if (!url || !url.includes("cloudinary.com")) return null;

   const matches = url.match(/\/doingSomething\/items\/([^.]+)/);
   return matches ? `doingSomething/items/${matches[1]}` : null;
};

export { cloudinary, upload, deleteImage, extractPublicId };
