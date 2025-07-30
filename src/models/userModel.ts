import { Schema, model, Types, Document } from "mongoose";
import { BodyType, Ethnicity, Gender, SubscriptionPlanName, SubscriptionStatus } from "@shared/enums";

export type DecodedUser = {
  authId: string;
  userId: string;
  name: string;
  email: string;
  isVerified: boolean;
};

export type UserSchema = Document & {
  auth: Types.ObjectId;
  isProfileComplete: boolean;
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  bodyType: string;
  ethnicity: string[];
  bio: string;
  personality: {
    spectrum: number;
    balance: number;
    focus: number;
  };
  interests: string[];
  avatar: string;
  compatibility: string[];
  location: {
    place: string;
    longitude: number;
    latitude: number;
  };
  preferences: {
    gender: Gender[];
    age: {
      min: number;
      max: number;
    };
    bodyType: string[];
    ethnicity: string[];
    distance: number;
  };
  survey: string[];
  subscription: {
    id: string;
    plan: string;
    fee: String;
    status: SubscriptionStatus;
    startedAt: Date;
  };
  isSelectedForPodcast: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema(
  {
    auth: {
      type: Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
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
    dateOfBirth: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
    },
    bodyType: {
      type: String,
      enum: Object.values(BodyType),
      default: "",
    },
    ethnicity: {
      type: [String],
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
        default: "",
      },
      age: {
        min: {
          type: Number,
          default: 25,
        },
        max: {
          type: Number,
          default: 35,
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
    isSelectedForPodcast: {
      type: Boolean,
    },
  },
  {
    timestamps: true,
  }
);


export const User = model<UserSchema>("User", userSchema);
export default User;
