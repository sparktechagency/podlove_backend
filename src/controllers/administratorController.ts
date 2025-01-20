import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Administrator from "@models/administratorModel";
import { AdminRole, AdminAccess } from "@shared/enum";

const JWT_SECRET = "your_jwt_secret_key";

export const createAdministrator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, contact, password, role, access } = req.body;

    if (!name || !email || !contact || !password || !role || !access) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Administrator({
      name,
      email,
      contact,
      password: hashedPassword,
      role,
      access,
    });

    const savedAdmin = await admin.save();
    res.status(201).json(savedAdmin);
  } catch (error) {
    next(error);
  }
};

export const getAllAdministrators = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const administrators = await Administrator.find();
    res.status(200).json(administrators);
  } catch (error) {
    next(error);
  }
};

export const updateAdministrator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedAdmin = await Administrator.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Administrator not found" });
    }

    res.status(200).json(updatedAdmin);
  } catch (error) {
    next(error);
  }
};

export const deleteAdministrator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deletedAdmin = await Administrator.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({ error: "Administrator not found" });
    }

    res.status(200).json({ message: "Administrator deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const searchAdministrators = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Invalid query parameter" });
    }

    const results = await Administrator.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { contact: { $regex: query, $options: "i" } },
      ],
    });

    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

export const loginAdministrator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find the admin by email
    const admin = await Administrator.findOne({ email });

    if (!admin) {
      return res.status(404).json({ error: "Administrator not found" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    next(error);
  }
};
