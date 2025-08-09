import { Types } from 'mongoose';

export interface AuthLean {
  _id: Types.ObjectId;
  email: string;
  isBlocked: boolean;
}

export interface Location {
  place: string;
  longitude: number;
  latitude: number;
}

export interface Preferences {
  gender: string[];
  age: { min: number; max: number };
  bodyType: string[];
  ethnicity: string[];
  distance: number;
}

export interface SubscriptionLean {
  id: string;
  plan: string;
  fee: string;
  status: string;
  startedAt: Date;
}

export interface LeanUserWithAuth {
  _id: Types.ObjectId;
  auth: AuthLean;

  isProfileComplete: boolean;
  name: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  bodyType: string;
  ethnicity: string[];
  bio: string;
  personality: { spectrum: number; balance: number; focus: number };
  interests: string[];
  avatar: string;
  compatibility: string[];

  location: Location;
  preferences: Preferences;
  survey: any[];

  subscription: SubscriptionLean;

  createdAt: Date;
  updatedAt: Date;
  __v: number;
}
