export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum AdminRole {
  HOST = "HOST",
}

export enum AdminAccess {
  ALL = "ALL",
  DASHBOARD = "DASHBOARD",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  PODCAST_MANAGEMENT = "PODCAST_MANAGEMENT",
  SUBSCRIPTIONS = "SUBSCRIPTIONS",
  SUPPORT = "SUPPORT",
  SETTINGS = "SETTINGS",
}

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
  NON_BINARY = "Non-binary",
  TRANSGENDER = "Transgender",
  GENDER_FLUID = "Gender-fluid",
}

export enum BodyType {
  ATHLETIC = "Athletic",
  CURVY = "Curvy",
  SLIM = "Slim",
  AVERAGE = "Average",
  PLUS_SIZE = "Plus-size",
  MUSCULAR = "Muscular",
}

export enum Ethnicity {
  BLACK = "African American/Black",
  ASIAN = "Asian",
  WHITE = "Caucasian/White",
  LATINO = "Hispanic/Latino",
  MIDDLE_EASTERN = "Middle Eastern",
  NATIVE = "Native American",
  PACIFIC = "Pacific Islander",
  OTHER = "Other",
}

export enum SubscriptionPlan {
  LISTENER = "Listener: Connection Starter",
  SPEAKER = "Speaker: Conversation Explorer",
  SEEKER = "Seeker: Connection Builder",
}

export enum SubscriptionStatus {
  PAID = "PAID",
  DUE = "DUE",
}

export enum PodcastStatus {
  NOT_SCHEDULED = "NotScheduled",
  SCHEDULED = "Scheduled",
  DONE = "Done",
}
