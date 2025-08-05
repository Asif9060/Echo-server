import mongoose, { Schema } from "mongoose";

const CategorySchema = new Schema(
   {
      name: {
         type: String,
         required: [true, "Category name is required"],
         trim: true,
         maxlength: [50, "Category name cannot exceed 50 characters"],
      },
      slug: {
         type: String,
         required: [true, "Category slug is required"],
         unique: true,
         trim: true,
         lowercase: true,
         match: [
            /^[a-z0-9-]+$/,
            "Slug can only contain lowercase letters, numbers, and hyphens",
         ],
      },
      description: {
         type: String,
         required: [true, "Category description is required"],
         trim: true,
         maxlength: [500, "Description cannot exceed 500 characters"],
      },
      icon: {
         type: String,
         trim: true,
      },
      gradient: {
         type: String,
         trim: true,
         default: "from-blue-500 to-purple-600",
      },
      status: {
         type: String,
         enum: ["active", "inactive"],
         default: "active",
      },
      sortOrder: {
         type: Number,
         default: 0,
      },
      itemCount: {
         type: Number,
         default: 0,
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes for better performance
CategorySchema.index({ status: 1, sortOrder: 1 });
CategorySchema.index({ name: "text", description: "text" });

// Pre-save middleware to generate slug if not provided
CategorySchema.pre("save", function (next) {
   if (!this.slug && this.name) {
      this.slug = this.name
         .toLowerCase()
         .replace(/[^a-z0-9]/g, "-")
         .replace(/-+/g, "-")
         .replace(/^-|-$/g, "");
   }
   next();
});

// Virtual for getting items in this category
CategorySchema.virtual("items", {
   ref: "Item",
   localField: "_id",
   foreignField: "category",
});

const Category = mongoose.model("Category", CategorySchema);

export default Category;
