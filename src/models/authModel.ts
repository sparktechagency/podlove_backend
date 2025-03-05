import { Schema, model, Document, Model } from "mongoose";
import bcrypt from "bcrypt";
import generateOTP from "@utils/generateOTP";
import { generateToken } from "@utils/jwt";

export type AuthSchema = Document & {
  email: string;
  password: string;
  googleId: string;
  appleId: string;
  verificationOTP: string;
  verificationOTPExpiredAt: Date | null;
  recoveryOTP: string;
  recoveryOTPExpiredAt: Date | null;
  isVerified: boolean;
  isBlocked: boolean;
  findByEmail(email: string): Promise<any>;
  comparePassword(password: string): Promise<boolean>;
  generateVerificationOTP(): void;
  clearVerificationOTP(): void;
  isCorrectVerificationOTP(otp: string): boolean;
  isVerificationOTPExpired(): boolean;
  generateRecoveryOTP(): void;
  clearRecoveryOTP(): void;
  isCorrectRecoveryOTP(otp: string): boolean;
  isRecoveryOTPExpired(): boolean;
};

const authSchema: Schema<AuthSchema> = new Schema<AuthSchema>({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
  },
  appleId: {
    type: String,
  },
  verificationOTP: {
    type: String,
  },
  verificationOTPExpiredAt: {
    type: Date,
  },
  recoveryOTP: {
    type: String,
  },
  recoveryOTPExpiredAt: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  }
});

authSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

authSchema.methods.generateVerificationOTP = function (): void {
  this.verificationOTP = generateOTP();
  this.verificationOTPExpiredAt = new Date(Date.now() + 60 * 60 * 1000);
};

authSchema.methods.clearVerificationOTP = function (): void {
  this.verificationOTP = "";
  this.verificationOTPExpiredAt = null;
};

authSchema.methods.isCorrectVerificationOTP = function (otp: string): boolean {
  return this.verificationOTP === otp;
};

authSchema.methods.isVerificationOTPExpired = function (): boolean {
  return this.verificationOTPExpiredAt !== null && this.verificationOTPExpiredAt < new Date();
};

authSchema.methods.generateRecoveryOTP = function (): void {
  this.recoveryOTP = generateOTP();
  this.recoveryOTPExpiredAt = new Date(Date.now() + 60 * 60 * 1000);
};

authSchema.methods.clearRecoveryOTP = function (): void {
  this.recoveryOTP = "";
  this.recoveryOTPExpiredAt = null;
};

authSchema.methods.isCorrectRecoveryOTP = function (otp: string): boolean {
  return this.recoveryOTP === otp;
};

authSchema.methods.isRecoveryOTPExpired = function (): boolean {
  return this.recoveryOTPExpiredAt !== null && this.recoveryOTPExpiredAt < new Date();
};

authSchema.statics.findByEmail = async function (email: string): Promise<AuthSchema | null> {
  return this.findOne({ email }).exec();
};

authSchema.statics.findByEmailWithOutPassword = async function (email: string): Promise<AuthSchema | null> {
  return this.findOne({ email }).select('-password').exec();
};

authSchema.statics.generateAccessToken = function (id: string): string {
  return generateToken(id, process.env.JWT_ACCESS_SECRET!);
};

authSchema.pre<AuthSchema>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

type AuthModel = Model<AuthSchema> & {
  findByEmail(email: string): Promise<AuthSchema | null>;
  findByEmailWithOutPassword(email: string): Promise<AuthSchema | null>;
  generateAccessToken(id: string): string;
};

const Auth = model<AuthSchema, AuthModel>("Auth", authSchema);
export default Auth;
