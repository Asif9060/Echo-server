import mongoose, { Schema } from "mongoose";

const ItemSchema = new Schema(
   {
      // --- All fields are now optional for flexibility ---
      title: { type: String, trim: true, maxlength: 200 },
      description: { type: String, trim: true, maxlength: 2000 },
      releaseDate: { type: Date },
      developer: { type: String, trim: true, maxlength: 100 },
      platforms: {
         type: [String],
         default: [],
      },
      genres: {
         type: [String],
         default: [],
      },
      keyFeatures: { type: [String], default: [] },
      storySummary: { type: String, default: "" },
      highlights: { type: [String], default: [] },
      authorReview: { type: String, trim: true },
      screenshots: {
         type: [String],
         default: [],
      },
      soundtrackLinks: {
         type: [String],
         default: [],
         validate: {
            validator: function (arr) {
               return arr.every((url) => /^https?:\/\//.test(url));
            },
            message: "All soundtrack links must be valid URLs.",
         },
      },
      ratings: {
         type: {
            story: { type: Number, min: 1, max: 5 },
            graphics: { type: Number, min: 1, max: 5 },
            gameplay: { type: Number, min: 1, max: 5 },
            replayability: { type: Number, min: 1, max: 5 },
         },
         default: undefined,
         required: false,
      },
      // Overall Rating (optional, 0-5)
      rating: {
         type: Number,
         min: 0,
         max: 5,
         required: false,
         default: undefined,
      },
      characters: {
         type: [
            {
               name: { type: String, trim: true, maxlength: 100 },
               image: { type: String }, // Cloudinary URL
               description: { type: String, trim: true, maxlength: 300 },
            },
         ],
         default: [],
      },

      // System fields - only category remains required for organization
      slug: {
         type: String,
         unique: true,
         trim: true,
         lowercase: true,
         match: [
            /^[a-z0-9-]+$/,
            "Slug can only contain lowercase letters, numbers, and hyphens",
         ],
      },
      category: {
         type: Schema.Types.ObjectId,
         ref: "Category",
         required: [true, "Category is required"],
      },
      status: {
         type: String,
         enum: ["active", "inactive", "draft"],
         default: "draft",
      },
   },
   {
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
   }
);

// Indexes for better performance
ItemSchema.index({ status: 1, sortOrder: 1 });
ItemSchema.index({ category: 1, status: 1 });
ItemSchema.index({ title: "text", description: "text" });
ItemSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug if not provided
ItemSchema.pre("save", function (next) {
   if (!this.slug && this.title) {
      this.slug = this.title
         .toLowerCase()
         .replace(/[^a-z0-9]/g, "-")
         .replace(/-+/g, "-")
         .replace(/^-|-$/g, "");
   }
   next();
});

// Post-save middleware to update category item count
ItemSchema.post("save", async function () {
   if (this.category) {
      const Category = mongoose.model("Category");
      const count = await mongoose.model("Item").countDocuments({
         category: this.category,
         status: "active",
      });
      await Category.findByIdAndUpdate(this.category, { itemCount: count });
   }
});

// Post-remove middleware to update category item count
ItemSchema.post("findOneAndDelete", async function (doc) {
   if (doc && doc.category) {
      const Category = mongoose.model("Category");
      const count = await mongoose.model("Item").countDocuments({
         category: doc.category,
         status: "active",
      });
      await Category.findByIdAndUpdate(doc.category, { itemCount: count });
   }
});

// Virtual for category details
ItemSchema.virtual("categoryDetails", {
   ref: "Category",
   localField: "category",
   foreignField: "_id",
   justOne: true,
});

const Item = mongoose.model("Item", ItemSchema);

export default Item;
