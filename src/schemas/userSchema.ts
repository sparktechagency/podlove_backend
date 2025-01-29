import { Document, Types } from "mongoose";
import { BodyType, Ethnicity, Gender, SubscriptionPlan, SubscriptionStatus } from "@shared/enums";

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
    gender: Gender;
    age: {
      min: Number;
      max: Number;
    };
    bodyType: string;
    ethnicity: string;
    distance: string;
  };
  survey: string[];
  subscription: {
    id: string;
    plan: string;
    fee: Number;
    status: SubscriptionStatus;
    startedAt: Date;
  };
};
