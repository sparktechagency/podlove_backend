import { Document, Types } from "mongoose";
import { BodyType, Ethnicity, Gender, SubscriptionPlan, SubscriptionStatus } from "@shared/enum";

export type UserSchema = Document & {
  auth: Types.ObjectId;
  name: string;
  phoneNumber: string;
  address: string | null;
  age: number;
  gender: String;
  bodyType: String;
  ethnicity: String;
  bio: String;
  personalality: {
    specturm: Number;
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
    bodyType: String;
    ethnicity: String;
    distance: String;
  };
  survey: string[];
  subscription: {
    plan: SubscriptionPlan;
    fee: Number;
    status: SubscriptionStatus;
    startedAt: Date;
  };
};
