import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Admin, { IAdmin } from "../models/Admin";
import { logger } from "../utils/logger";

export interface AuthRequest extends Request {
   admin?: IAdmin;
}

export const authenticate = async (
   req: AuthRequest,
   res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const token =
         req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;

      if (!token) {
         res.status(401).json({
            success: false,
            message: "Access denied. No token provided.",
         });
         return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const admin = await Admin.findById(decoded.id).select("-password");

      if (!admin) {
         res.status(401).json({
            success: false,
            message: "Invalid token. Admin not found.",
         });
         return;
      }

      if (!admin.isActive) {
         res.status(401).json({
            success: false,
            message: "Account is inactive. Please contact administrator.",
         });
         return;
      }

      req.admin = admin;
      next();
   } catch (error) {
      logger.error("Authentication error:", error);
      res.status(401).json({
         success: false,
         message: "Invalid token.",
      });
   }
};

export const authorize = (...roles: string[]) => {
   return (req: AuthRequest, res: Response, next: NextFunction): void => {
      if (!req.admin) {
         res.status(401).json({
            success: false,
            message: "Access denied. Authentication required.",
         });
         return;
      }

      if (!roles.includes(req.admin.role)) {
         res.status(403).json({
            success: false,
            message: "Access denied. Insufficient permissions.",
         });
         return;
      }

      next();
   };
};

export const optionalAuth = async (
   req: AuthRequest,
   _res: Response,
   next: NextFunction
): Promise<void> => {
   try {
      const token =
         req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;

      if (token) {
         const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
         const admin = await Admin.findById(decoded.id).select("-password");

         if (admin && admin.isActive) {
            req.admin = admin;
         }
      }

      next();
   } catch (error) {
      // Continue without authentication for optional auth
      next();
   }
};
