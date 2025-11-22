import { Schema, Document, model } from "mongoose";

export interface IVerifyPhone extends Document {
    number: string;
    otp: string;
    otpExpiredAt: Date | null;
    used: boolean;
}

const verifyPhoneSchema = new Schema<IVerifyPhone>({
    number: {
        type: String,
        required: true,
        unique: true,
    },
    otp: {
        type: String,
        required: true,
    },
    otpExpiredAt: {
        type: Date,
        default: null,
        index: { expires: 0 }, // Auto delete after expiry
    },
    used: {
        type: Boolean,
        default: false,
    }
});

verifyPhoneSchema.index({ number: 1, otpExpiredAt: 1 });

const VerifyPhone = model<IVerifyPhone>("VerifyPhone", verifyPhoneSchema);
export default VerifyPhone;
