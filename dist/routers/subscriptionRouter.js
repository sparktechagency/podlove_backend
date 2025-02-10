"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const subscriptionServices_1 = __importDefault(require("@services/subscriptionServices"));
const authorization_1 = require("@middlewares/authorization");
const router = express_1.default.Router();
router.post("/upgrade", authorization_1.authorize, subscriptionServices_1.default.upgrade);
router.post("/cancel", subscriptionServices_1.default.cancel);
exports.default = router;
