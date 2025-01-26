"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginAdministrator = exports.searchAdministrators = exports.deleteAdministrator = exports.updateAdministrator = exports.getAllAdministrators = exports.createAdministrator = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const administratorModel_1 = __importDefault(require("../models/administratorModel"));
const JWT_SECRET = "your_jwt_secret_key";
const createAdministrator = async (req, res, next) => {
    try {
        const { name, email, contact, password, role, access } = req.body;
        if (!name || !email || !contact || !password || !role || !access) {
            return res.status(400).json({ error: "All fields are required" });
        }
        // Hash the password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const admin = new administratorModel_1.default({
            name,
            email,
            contact,
            password: hashedPassword,
            role,
            access,
        });
        const savedAdmin = await admin.save();
        res.status(201).json(savedAdmin);
    }
    catch (error) {
        next(error);
    }
};
exports.createAdministrator = createAdministrator;
const getAllAdministrators = async (req, res, next) => {
    try {
        const administrators = await administratorModel_1.default.find();
        res.status(200).json(administrators);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllAdministrators = getAllAdministrators;
const updateAdministrator = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedAdmin = await administratorModel_1.default.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!updatedAdmin) {
            return res.status(404).json({ error: "Administrator not found" });
        }
        res.status(200).json(updatedAdmin);
    }
    catch (error) {
        next(error);
    }
};
exports.updateAdministrator = updateAdministrator;
const deleteAdministrator = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedAdmin = await administratorModel_1.default.findByIdAndDelete(id);
        if (!deletedAdmin) {
            return res.status(404).json({ error: "Administrator not found" });
        }
        res.status(200).json({ message: "Administrator deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAdministrator = deleteAdministrator;
const searchAdministrators = async (req, res, next) => {
    try {
        const { query } = req.query;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ error: "Invalid query parameter" });
        }
        const results = await administratorModel_1.default.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { contact: { $regex: query, $options: "i" } },
            ],
        });
        res.status(200).json(results);
    }
    catch (error) {
        next(error);
    }
};
exports.searchAdministrators = searchAdministrators;
const loginAdministrator = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        // Find the admin by email
        const admin = await administratorModel_1.default.findOne({ email });
        if (!admin) {
            return res.status(404).json({ error: "Administrator not found" });
        }
        // Compare passwords
        const isPasswordValid = await bcrypt_1.default.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "Login successful", token });
    }
    catch (error) {
        next(error);
    }
};
exports.loginAdministrator = loginAdministrator;
