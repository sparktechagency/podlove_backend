"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tacControllers_1 = __importDefault(require("@controllers/tacControllers"));
const router = express_1.default.Router();
router.post("/create", tacControllers_1.default.create);
router.get("/", tacControllers_1.default.get);
router.put("/update", tacControllers_1.default.update);
exports.default = router;
