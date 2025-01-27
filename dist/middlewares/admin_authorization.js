"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoveryAuthorize = exports.isAdmin = exports.getAdminInfo = void 0;
const await_to_ts_1 = __importDefault(require("await-to-ts"));
require("dotenv/config");
const http_errors_1 = __importDefault(require("http-errors"));
const jwt_1 = require("../utils/jwt");
const http_status_codes_1 = require("http-status-codes");
const administratorModel_1 = __importDefault(require("../models/administratorModel"));
const getAdminInfo = async (id) => {
    let error, admin, data;
    [error, admin] = await (0, await_to_ts_1.default)(administratorModel_1.default.findById(id));
    if (error || !admin)
        return null;
    data = {
        id: admin._id.toString(),
        isAdmin: true
    };
    return data;
};
exports.getAdminInfo = getAdminInfo;
const authorizeToken = (secret, errorMessage) => {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Not Authorized"));
        }
        const token = authHeader.split(" ")[1];
        if (!secret) {
            return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, "JWT secret is not defined."));
        }
        const [error, decoded] = (0, jwt_1.decodeToken)(token, secret);
        if (error)
            return next(error);
        if (!decoded)
            return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.UNAUTHORIZED, errorMessage));
        const data = await (0, exports.getAdminInfo)(decoded.id);
        if (!data)
            return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Account Not Found"));
        if (!data.isAdmin)
            return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.FORBIDDEN, "Forbidden"));
        req.admin = data;
        return next();
    };
};
exports.isAdmin = authorizeToken(process.env.JWT_ADMIN_SECRET, "Invalid Access Token");
exports.recoveryAuthorize = authorizeToken(process.env.JWT_RECOVERY_SECRET, "Invalid Recovery Token");
