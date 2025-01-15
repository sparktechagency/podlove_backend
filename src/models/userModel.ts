import { Schema, model } from "mongoose";
import { BodyType, Ethnicity, Gender } from "@shared/enum";
import { UserSchema } from "@schemas/userSchema";

const userSchema = new Schema<UserSchema>(
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
      default: null,
    },
    age: {
      type: Number,
      min: 35,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    bodyType: {
      type: String,
      enum: Object.values(BodyType),
    },
    ethnicity: {
      type: String,
      enum: Object.values(Ethnicity),
    },
    bio: {
      type: String,
      trim: true,
    },
    personalality: {
      specturm: {
        type: Number,
        min: 1,
        max: 7,
      },
      balance: {
        type: Number,
        min: 1,
        max: 7,
      },
      focus: {
        type: Number,
        min: 1,
        max: 7,
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
      },
      longitude: {
        type: Number,
      },
      latitude: {
        type: Number,
      },
    },
    preferences: {
      gender: {
        type: String,
        enum: Object.values(Gender),
      },
      age: {
        min: {
          type: Number,
        },
        max: {
          type: Number,
        },
      },
      bodyType: {
        type: String,
        enum: Object.values(BodyType),
      },
      ethnicity: {
        type: String,
        enum: Object.values(Ethnicity),
      },
      distance: {
        type: Number,
      },
    },
    survey: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<UserSchema>("User", userSchema);
export default User;
