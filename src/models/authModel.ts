import { Schema, model, Document } from "mongoose";

export type AuthSchema = Document & {
  email: string;
  password: string;
  verificationOTP: string;
  verificationOTPExpiredAt: Date | null;
  recoveryOTP: string;
  recoveryOTPExpiredAt: Date | null;
  isVerified: boolean;
  isBlocked: boolean;
  googleId: {
    id: string;
    isNew: boolean;
  };
  appleId: {
    id: string;
    isNew: boolean;
  };
};

const authSchema = new Schema<AuthSchema>({
  email: {
    type: String,
    unique: true,
  },
  password: {
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
  },
  googleId: {
    id: {
      type: String,
    },
    isNew: {
      type: Boolean,
    },
  },
  appleId: {
    id: {
      type: String,
    },
    isNew: {
      type: Boolean,
    },
  },
});

const Auth = model<AuthSchema>("Auth", authSchema);
export default Auth;
