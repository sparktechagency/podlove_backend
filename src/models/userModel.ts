import { Schema, model, Types, Document } from "mongoose";
import { BodyType, Ethnicity, Gender, SubscriptionPlanName, SubscriptionStatus } from "@shared/enums";

export type UserSchema = Document & {
  auth: Types.ObjectId;
  name: string;
  phoneNumber: string;
  address: string | null;
  age: number;
  gender: string;
  bodyType: string;
  ethnicity: string;
  bio: string;
  personality: {
    spectrum: Number;
    balance: Number;
    focus: Number;
  };
  interests: string[];
  avatar: string;
  compatibility: string[];
  location: {
    place: string;
    longitude: Number;
    latitude: Number;
  };
  preferences: {
    gender: Gender[];
    age: {
      min: Number;
      max: Number;
    };
    bodyType: string[];
    ethnicity: string[];
    distance: string;
  };
  survey: string[];
  subscription: {
    id: string;
    plan: string;
    fee: String;
    status: SubscriptionStatus;
    startedAt: Date;
  };
};

const userSchema = new Schema(
  {
    auth: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    age: {
      type: Number,
      min: 35,
      default: 35,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      default: "",
    },
    bodyType: {
      type: String,
      enum: Object.values(BodyType),
      default: "",
    },
    ethnicity: {
      type: String,
      enum: Object.values(Ethnicity),
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      default: "",
    },
    personality: {
      spectrum: {
        type: Number,
        min: 1,
        max: 7,
        default: 1,
      },
      balance: {
        type: Number,
        min: 1,
        max: 7,
        default: 1,
      },
      focus: {
        type: Number,
        min: 1,
        max: 7,
        default: 1,
      },
    },
    interests: {
      type: [String],
      default: [],
    },
    avatar: {
      type: String,
      default: "",
    },
    compatibility: {
      type: [String],
      default: [],
    },
    location: {
      place: {
        type: String,
        default: "",
      },
      longitude: {
        type: Number,
        default: 0,
      },
      latitude: {
        type: Number,
        default: 0,
      },
    },
    preferences: {
      gender: {
        type: [String],
        enum: Object.values(Gender),
        default: "",
      },
      age: {
        min: {
          type: Number,
          default: 35,
        },
        max: {
          type: Number,
          default: 80,
        },
      },
      bodyType: {
        type: [String],
        enum: Object.values(BodyType),
        default: "",
      },
      ethnicity: {
        type: [String],
        enum: Object.values(Ethnicity),
        default: "",
      },
      distance: {
        type: Number,
        default: 0,
      },
    },
    survey: {
      type: [String],
      default: [],
    },
    subscription: {
      id: {
        type: String,
        default: "",
      },
      plan: {
        type: String,
        default: SubscriptionPlanName.LISTENER,
      },
      fee: {
        type: String,
        default: "Free",
      },
      status: {
        type: String,
        enum: Object.values(SubscriptionStatus),
        default: "",
      },
      startedAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<UserSchema>("User", userSchema);
export default User;
