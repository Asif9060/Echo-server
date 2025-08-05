import mongoose, { Document, Schema } from "mongoose";

export interface IItem extends Document {
   title: string;
   slug: string;
   description: string;
   category: mongoose.Types.ObjectId;
   images: string[];
   thumbnail?: string;
   status: "active" | "inactive" | "draft";
   featured: boolean;
   rating?: number;
   tags: string[];
   metadata: {
      genre?: string[];
      releaseDate?: Date;
      duration?: string;
      language?: string;
      country?: string;
      director?: string;
      cast?: string[];
      [key: string]: any;
   };
   viewCount: number;
   sortOrder: number;
   createdBy: mongoose.Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
   {
      title: {
         type: String,
         required: [true, "Item title is required"],
         trim: true,
         maxlength: [200, "Title cannot exceed 200 characters"],
      },
      slug: {
         type: String,
         required: [true, "Item slug is required"],
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
         required: [true, "Item description is required"],
         trim: true,
         maxlength: [2000, "Description cannot exceed 2000 characters"],
      },
      category: {
         type: Schema.Types.ObjectId,
         ref: "Category",
         required: [true, "Category is required"],
      },
      images: [
         {
            type: String,
            trim: true,
         },
      ],
      thumbnail: {
         type: String,
         trim: true,
      },
      status: {
         type: String,
         enum: ["active", "inactive", "draft"],
         default: "draft",
      },
      featured: {
         type: Boolean,
         default: false,
      },
      rating: {
         type: Number,
         min: [0, "Rating cannot be less than 0"],
         max: [10, "Rating cannot be more than 10"],
      },
      tags: [
         {
            type: String,
            trim: true,
            lowercase: true,
         },
      ],
      metadata: {
         genre: [
            {
               type: String,
               trim: true,
            },
         ],
         releaseDate: Date,
         duration: String,
         language: String,
         country: String,
         director: String,
         cast: [
            {
               type: String,
               trim: true,
            },
         ],
      },
      viewCount: {
         type: Number,
         default: 0,
      },
      sortOrder: {
         type: Number,
         default: 0,
      },
      createdBy: {
         type: Schema.Types.ObjectId,
         ref: "Admin",
         required: true,
      },
   },
   {
      timestamps: true,
   }
);

// Create indexes
ItemSchema.index({ slug: 1 });
ItemSchema.index({ category: 1 });
ItemSchema.index({ status: 1 });
ItemSchema.index({ featured: 1 });
ItemSchema.index({ createdBy: 1 });
ItemSchema.index({ sortOrder: 1 });
ItemSchema.index({ viewCount: -1 });
ItemSchema.index({ rating: -1 });
ItemSchema.index({ createdAt: -1 });
ItemSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model<IItem>("Item", ItemSchema);
