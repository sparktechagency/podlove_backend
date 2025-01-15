"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const http_errors_1 = __importDefault(require("http-errors"));
const generateToken = (id, secret, duration) => jsonwebtoken_1.default.sign({ id }, secret, { expiresIn: duration });
exports.generateToken = generateToken;
const decodeToken = (token, secret) => {
    let decoded = null;
    try {
        decoded = jsonwebtoken_1.default.verify(token, secret);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.TokenExpiredError) {
            return [(0, http_errors_1.default)(401, "Token has expired"), null];
        }
        if (err instanceof jsonwebtoken_1.JsonWebTokenError) {
            return [(0, http_errors_1.default)(401, "Invalid or malformed token"), null];
        }
        return [(0, http_errors_1.default)(500, "Internal Server Error"), null];
    }
    return [null, decoded];
};
exports.decodeToken = decodeToken;
