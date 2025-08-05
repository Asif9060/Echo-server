import { Response } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin";
import { AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

// Generate JWT token
const generateToken = (id: string): string => {
   return jwt.sign({ id }, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
   } as jwt.SignOptions);
};

// Login admin
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ email, isActive: true });
      if (!admin) {
         res.status(401).json({
            success: false,
            message: "Invalid email or password",
         });
         return;
      }

      // Check password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
         res.status(401).json({
            success: false,
            message: "Invalid email or password",
         });
         return;
      }

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate token
      const token = generateToken((admin._id as any).toString());

      // Set cookie
      const cookieOptions = {
         expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
         httpOnly: true,
         secure: process.env.NODE_ENV === "production",
         sameSite: "strict" as const,
      };

      res.cookie("token", token, cookieOptions);

      res.status(200).json({
         success: true,
         message: "Login successful",
         data: {
            admin: {
               id: admin._id,
               username: admin.username,
               email: admin.email,
               role: admin.role,
               lastLogin: admin.lastLogin,
            },
            token,
         },
      });
   } catch (error) {
      logger.error("Login error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Register admin (only super_admin can create new admins)
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const { username, email, password, role = "admin" } = req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
         $or: [{ email }, { username }],
      });

      if (existingAdmin) {
         res.status(400).json({
            success: false,
            message: "Admin with this email or username already exists",
         });
         return;
      }

      // Create new admin
      const admin = new Admin({
         username,
         email,
         password,
         role,
      });

      await admin.save();

      res.status(201).json({
         success: true,
         message: "Admin created successfully",
         data: {
            admin: {
               id: admin._id,
               username: admin.username,
               email: admin.email,
               role: admin.role,
            },
         },
      });
   } catch (error) {
      logger.error("Registration error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Logout admin
export const logout = async (_req: AuthRequest, res: Response): Promise<void> => {
   try {
      res.clearCookie("token");
      res.status(200).json({
         success: true,
         message: "Logout successful",
      });
   } catch (error) {
      logger.error("Logout error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Get current admin profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const admin = req.admin;
      if (!admin) {
         res.status(401).json({
            success: false,
            message: "Admin not found",
         });
         return;
      }

      res.status(200).json({
         success: true,
         data: {
            admin: {
               id: admin._id,
               username: admin.username,
               email: admin.email,
               role: admin.role,
               lastLogin: admin.lastLogin,
               createdAt: admin.createdAt,
            },
         },
      });
   } catch (error) {
      logger.error("Get profile error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Update admin profile
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const admin = req.admin;
      if (!admin) {
         res.status(401).json({
            success: false,
            message: "Admin not found",
         });
         return;
      }

      const { username, email } = req.body;

      // Check if username/email is already taken by another admin
      const existingAdmin = await Admin.findOne({
         $and: [{ _id: { $ne: admin._id } }, { $or: [{ email }, { username }] }],
      });

      if (existingAdmin) {
         res.status(400).json({
            success: false,
            message: "Username or email already taken",
         });
         return;
      }

      // Update admin
      admin.username = username || admin.username;
      admin.email = email || admin.email;
      await admin.save();

      res.status(200).json({
         success: true,
         message: "Profile updated successfully",
         data: {
            admin: {
               id: admin._id,
               username: admin.username,
               email: admin.email,
               role: admin.role,
            },
         },
      });
   } catch (error) {
      logger.error("Update profile error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
      const admin = req.admin;
      if (!admin) {
         res.status(401).json({
            success: false,
            message: "Admin not found",
         });
         return;
      }

      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
         res.status(400).json({
            success: false,
            message: "Current password is incorrect",
         });
         return;
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      res.status(200).json({
         success: true,
         message: "Password changed successfully",
      });
   } catch (error) {
      logger.error("Change password error:", error);
      res.status(500).json({
         success: false,
         message: "Internal server error",
      });
   }
};
