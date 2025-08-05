import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
   name: string;
   slug: string;
   description: string;
   icon?: string;
   gradient?: string;
   status: "active" | "inactive";
   sortOrder: number;
   itemCount: number;
   createdAt: Date;
   updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
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
   }
);

// Create indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ status: 1 });
CategorySchema.index({ sortOrder: 1 });
CategorySchema.index({ name: "text", description: "text" });

export default mongoose.model<ICategory>("Category", CategorySchema);
