import { Schema, model } from "mongoose";
import { BodyType, Ethnicity, Gender, SubscriptionPlan, SubscriptionStatus } from "@shared/enum";

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
      required: true,
      unique: true,
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
        type: String,
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
        type: String,
        enum: Object.values(BodyType),
        default: "",
      },
      ethnicity: {
        type: String,
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
      plan: {
        type: String,
        enum: Object.values(SubscriptionPlan),
        default: SubscriptionPlan.LISTENER,
      },
      fee: {
        type: Number,
        default: 0,
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

export const User = model("User ", userSchema);
export default User;
