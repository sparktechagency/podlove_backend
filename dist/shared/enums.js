"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Months = exports.PodcastStatus = exports.SubscriptionStatus = exports.SubscriptionPlanName = exports.Ethnicity = exports.BodyType = exports.Gender = exports.AdminAccess = exports.Method = exports.Role = void 0;
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["ADMIN"] = "ADMIN";
})(Role || (exports.Role = Role = {}));
var Method;
(function (Method) {
    Method["emailActivation"] = "emailActivation";
    Method["phoneActivation"] = "phoneActivation";
    Method["emailRecovery"] = "emailRecovery";
})(Method || (exports.Method = Method = {}));
var AdminAccess;
(function (AdminAccess) {
    AdminAccess["ALL"] = "ALL";
    AdminAccess["DASHBOARD"] = "DASHBOARD";
    AdminAccess["USER_MANAGEMENT"] = "USER_MANAGEMENT";
    AdminAccess["PODCAST_MANAGEMENT"] = "PODCAST_MANAGEMENT";
    AdminAccess["SUBSCRIPTIONS"] = "SUBSCRIPTIONS";
    AdminAccess["SUPPORT"] = "SUPPORT";
    AdminAccess["SETTINGS"] = "SETTINGS";
})(AdminAccess || (exports.AdminAccess = AdminAccess = {}));
var Gender;
(function (Gender) {
    Gender["NONE"] = "";
    Gender["MALE"] = "Male";
    Gender["FEMALE"] = "Female";
    Gender["NON_BINARY"] = "Non-binary";
    Gender["TRANSGENDER"] = "Transgender";
    Gender["GENDER_FLUID"] = "Gender-fluid";
})(Gender || (exports.Gender = Gender = {}));
var BodyType;
(function (BodyType) {
    BodyType["NONE"] = "";
    BodyType["ATHLETIC"] = "Athletic";
    BodyType["CURVY"] = "Curvy";
    BodyType["SLIM"] = "Slim";
    BodyType["AVERAGE"] = "Average";
    BodyType["PLUS_SIZE"] = "Plus-size";
    BodyType["MUSCULAR"] = "Muscular";
})(BodyType || (exports.BodyType = BodyType = {}));
var Ethnicity;
(function (Ethnicity) {
    Ethnicity["NONE"] = "";
    Ethnicity["BLACK"] = "African American/Black";
    Ethnicity["ASIAN"] = "Asian";
    Ethnicity["WHITE"] = "Caucasian/White";
    Ethnicity["LATINO"] = "Hispanic/Latino";
    Ethnicity["MIDDLE_EASTERN"] = "Middle Eastern";
    Ethnicity["NATIVE"] = "Native American";
    Ethnicity["PACIFIC"] = "Pacific Islander";
    Ethnicity["OTHER"] = "Other";
})(Ethnicity || (exports.Ethnicity = Ethnicity = {}));
var SubscriptionPlanName;
(function (SubscriptionPlanName) {
    SubscriptionPlanName["LISTENER"] = "Listener: Connection Starter";
    SubscriptionPlanName["SPEAKER"] = "Speaker: Conversation Explorer";
    SubscriptionPlanName["SEEKER"] = "Seeker: Connection Builder";
})(SubscriptionPlanName || (exports.SubscriptionPlanName = SubscriptionPlanName = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["NONE"] = "";
    SubscriptionStatus["PAID"] = "PAID";
    SubscriptionStatus["DUE"] = "DUE";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PodcastStatus;
(function (PodcastStatus) {
    PodcastStatus["NOT_SCHEDULED"] = "NotScheduled";
    PodcastStatus["SCHEDULED"] = "Scheduled";
    PodcastStatus["DONE"] = "Done";
})(PodcastStatus || (exports.PodcastStatus = PodcastStatus = {}));
var Months;
(function (Months) {
    Months["JAN"] = "JAN";
    Months["FEB"] = "FEB";
    Months["MAR"] = "MAR";
    Months["APR"] = "APR";
    Months["MAY"] = "MAY";
    Months["JUN"] = "JUN";
    Months["JUL"] = "JUL";
    Months["AUG"] = "AUG";
    Months["SEP"] = "SEP";
    Months["OCT"] = "OCT";
    Months["NOV"] = "NOV";
    Months["DEC"] = "DEC";
})(Months || (exports.Months = Months = {}));
