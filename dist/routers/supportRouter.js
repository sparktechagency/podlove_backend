"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supportControllers_1 = __importDefault(require("../controllers/supportControllers"));
const express_1 = __importDefault(require("express"));
const supportServices_1 = __importDefault(require("../services/supportServices"));
const router = express_1.default.Router();
router.post("/create", supportControllers_1.default.create);
router.get("/", supportControllers_1.default.getAll);
router.get("/:id", supportControllers_1.default.get);
router.post("/reply/:id", supportServices_1.default.reply);
exports.default = router;
