"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authorization_1 = require("../middlewares/authorization");
const surveyController_1 = __importDefault(require("../controllers/surveyController"));
const router = express_1.default.Router();
router.post("/create", authorization_1.authorize, surveyController_1.default.create);
router.get("/:id", surveyController_1.default.get);
exports.default = router;
