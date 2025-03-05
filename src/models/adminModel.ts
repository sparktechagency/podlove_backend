import { Schema, model, Model } from "mongoose";
import { AdminAccess } from "@shared/enums";
import { Document } from "mongoose";
import * as readline from "node:readline";
import { generateToken } from "@utils/jwt";
import generateOTP from "@utils/generateOTP";
import bcrypt from "bcrypt";
import { logger } from "@shared/logger";

export type DecodedAdmin = {
  id: string;
  email: string;
};

export type AdminSchema = Document & {
  name: string;
  email: string;
  password: string;
  avatar: string;
  address: string;
  contact: string;
  access: AdminAccess;
  recoveryOTP: string;
  recoveryOTPExpiredAt: Date | null;
  comparePassword(password: string): Promise<boolean>;
  generateRecoveryOTP(): void;
  clearRecoveryOTP(): void;
  isCorrectRecoveryOTP(otp: string): boolean;
  isRecoveryOTPExpired(): boolean;
};

const adminSchema : Schema<AdminSchema> = new Schema<AdminSchema>({
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contact: {
    type: String,
    required: true
  },
  address: {
    type: String,
    default: ""
  },
  password: {
    type: String,
    required: true
  },
  access: {
    type: String,
    required: true,
    enum: Object.values(AdminAccess)
  },
  recoveryOTP: {
    type: String
  },
  recoveryOTPExpiredAt: {
    type: Date
  }
});

adminSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

adminSchema.methods.generateRecoveryOTP = function (): void {
  this.recoveryOTP = generateOTP();
  this.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
};

adminSchema.methods.clearRecoveryOTP = function (): void {
  this.recoveryOTP = "";
  this.recoveryOTPExpiredAt = null;
};

adminSchema.methods.isCorrectRecoveryOTP = function (otp: string): boolean {
  return this.recoveryOTP === otp;
};

adminSchema.methods.isRecoveryOTPExpired = function (): boolean {
  return this.recoveryOTPExpiredAt !== null && this.recoveryOTPExpiredAt < new Date();
};


adminSchema.statics.findByEmail = async function (email: string): Promise<AdminSchema | null> {
  return this.findOne({ email }).exec();
};

adminSchema.statics.findByEmailWithoutPassword = async function (email: string): Promise<AdminSchema | null> {
  return this.findOne({ email }).select('-password').exec();
};

adminSchema.statics.generateAccessToken = function (id: string): string {
  return generateToken(id, process.env.JWT_ACCESS_SECRET!);
};

adminSchema.statics.findOrCreate = async function (): Promise<void> {
  const admin = await this.findOne();
  if (!admin) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const name = await new Promise<string>((resolve) => {
      rl.question("Enter your name: ", (answer) => resolve(answer));
    });

    const email = await new Promise<string>((resolve) => {
      rl.question("Enter your email address: ", (answer) => resolve(answer));
    });

    const password = await new Promise<string>((resolve) => {
      rl.question("Enter your password: ", (answer) => resolve(answer));
    });

    rl.close();

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.create({
      name,
      email,
      password: hashedPassword,
    });

    logger.info("admin created successfully");
  } else {
    logger.info("admin account exists");
  }
};

adminSchema.pre<AdminSchema>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

type AdminModel = Model<AdminSchema> & {
  findByEmail(email: string): Promise<AdminSchema | null>;
  findByEmailWithoutPassword(email: string): Promise<AdminSchema | null>
  findOrCreate(): Promise<void>;
  generateAccessToken(id: string): string;
};

const Admin = model<AdminSchema, AdminModel>("Admin", adminSchema);
export default Admin;
