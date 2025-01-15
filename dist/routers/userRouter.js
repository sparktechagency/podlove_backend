"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = __importDefault(require("../controllers/userController"));
const authorization_1 = require("../middlewares/authorization");
const userServices_1 = __importDefault(require("../services/userServices"));
const router = express_1.default.Router();
router.get("/get-users", authorization_1.authorize, authorization_1.isAdmin, userServices_1.default.getAllUsers);
router.get("/", authorization_1.authorize, userController_1.default.get);
router.put("/update", authorization_1.authorize, userController_1.default.update);
router.post("/block/:authId", authorization_1.authorize, authorization_1.isAdmin, userServices_1.default.block);
router.post("/unblock/:authId", authorization_1.authorize, authorization_1.isAdmin, userServices_1.default.unblock);
exports.default = router;
