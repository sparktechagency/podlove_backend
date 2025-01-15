"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ethnicity = exports.BodyType = exports.Gender = exports.Role = void 0;
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["ADMIN"] = "ADMIN";
    Role["ADMINISTRATOR"] = "ADMINISTRATOR";
})(Role || (exports.Role = Role = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "Male";
    Gender["FEMALE"] = "Female";
    Gender["NON_BINARY"] = "Non-binary";
    Gender["TRANSGENDER"] = "Transgender";
    Gender["GENDER_FLUID"] = "Gender-fluid";
})(Gender || (exports.Gender = Gender = {}));
var BodyType;
(function (BodyType) {
    BodyType["ATHLETIC"] = "Athletic";
    BodyType["CURVY"] = "Curvy";
    BodyType["SLIM"] = "Slim";
    BodyType["AVERAGE"] = "Average";
    BodyType["PLUS_SIZE"] = "Plus-size";
    BodyType["MUSCULAR"] = "Muscular";
})(BodyType || (exports.BodyType = BodyType = {}));
var Ethnicity;
(function (Ethnicity) {
    Ethnicity["BLACK"] = "African American/Black";
    Ethnicity["ASIAN"] = "Asian";
    Ethnicity["WHITE"] = "Caucasian/White";
    Ethnicity["LATINO"] = "Hispanic/Latino";
    Ethnicity["MIDDLE_EASTERN"] = "Middle Eastern";
    Ethnicity["NATIVE"] = "Native American";
    Ethnicity["PACIFIC"] = "Pacific Islander";
    Ethnicity["OTHER"] = "Other";
})(Ethnicity || (exports.Ethnicity = Ethnicity = {}));
