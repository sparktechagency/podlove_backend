"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsControllers_1 = __importDefault(require("@controllers/analyticsControllers"));
const router = express_1.default.Router();
router.get("/income/:year", analyticsControllers_1.default.getIncomeByYear);
router.get("/subscription/:year", analyticsControllers_1.default.getSubscriptionByYear);
router.get("/", analyticsControllers_1.default.getAnalytics);
exports.default = router;
