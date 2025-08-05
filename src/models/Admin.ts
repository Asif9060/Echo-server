import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
   username: string;
   email: string;
   password: string;
   role: "admin" | "super_admin";
   isActive: boolean;
   lastLogin?: Date;
   createdAt: Date;
   updatedAt: Date;
   comparePassword(password: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdmin>(
   {
      username: {
         type: String,
         required: [true, "Username is required"],
         unique: true,
         trim: true,
         minlength: [3, "Username must be at least 3 characters long"],
         maxlength: [30, "Username cannot exceed 30 characters"],
      },
      email: {
         type: String,
         required: [true, "Email is required"],
         unique: true,
         trim: true,
         lowercase: true,
         match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email",
         ],
      },
      password: {
         type: String,
         required: [true, "Password is required"],
         minlength: [6, "Password must be at least 6 characters long"],
      },
      role: {
         type: String,
         enum: ["admin", "super_admin"],
         default: "admin",
      },
      isActive: {
         type: Boolean,
         default: true,
      },
      lastLogin: {
         type: Date,
      },
   },
   {
      timestamps: true,
   }
);

// Hash password before saving
AdminSchema.pre("save", async function (next) {
   if (!this.isModified("password")) return next();

   try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
   } catch (error) {
      next(error as Error);
   }
});

// Compare password method
AdminSchema.methods.comparePassword = async function (
   password: string
): Promise<boolean> {
   return bcrypt.compare(password, this.password);
};

// Create indexes
AdminSchema.index({ email: 1 });
AdminSchema.index({ username: 1 });
AdminSchema.index({ isActive: 1 });

export default mongoose.model<IAdmin>("Admin", AdminSchema);
