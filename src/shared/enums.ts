export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum Method {
  emailActivation = "emailActivation",
  phoneActivation = "phoneActivation",
  emailRecovery = "emailRecovery",
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
  NONE = "",
  MALE = "Male",
  FEMALE = "Female",
  NON_BINARY = "Non-binary",
  TRANSGENDER = "Transgender",
  GENDER_FLUID = "Gender-fluid",
}

export enum BodyType {
  NONE = "",
  ATHLETIC = "Athletic",
  CURVY = "Curvy",
  SLIM = "Slim",
  AVERAGE = "Average",
  PLUS_SIZE = "Plus-size",
  MUSCULAR = "Muscular",
}

export enum Ethnicity {
  NONE = "",
  BLACK = "African American/Black",
  ASIAN = "Asian",
  WHITE = "Caucasian/White",
  LATINO = "Hispanic/Latino",
  MIDDLE_EASTERN = "Middle Eastern",
  NATIVE = "Native American",
  PACIFIC = "Pacific Islander",
  OTHER = "Other",
}

export enum SubscriptionPlanName {
  LISTENER = "Listener: Connection Starter",
  SPEAKER = "Speaker: Conversation Explorer",
  SEEKER = "Seeker: Connection Builder",
}

export enum SubscriptionStatus {
  NONE = "",
  PAID = "PAID",
  DUE = "DUE",
}

export enum PodcastType {
  "Date" = "Date",
  "Feedback" = "Feedback"
}

export enum PodcastStatus {
  NOT_SCHEDULED = "NotScheduled",
  REQSHEDULED = "ReqScheduled",
  SCHEDULED = "Scheduled",
  PLAYING = "Playing",
  DONE = "Done",
  FINISHED = "Finished"
}

export enum Months {
  JAN = "JAN",
  FEB = "FEB",
  MAR = "MAR",
  APR = "APR",
  MAY = "MAY",
  JUN = "JUN",
  JUL = "JUL",
  AUG = "AUG",
  SEP = "SEP",
  OCT = "OCT",
  NOV = "NOV",
  DEC = "DEC",
}
