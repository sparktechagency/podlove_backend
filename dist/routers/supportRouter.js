"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supportControllers_1 = __importDefault(require("../controllers/supportControllers"));
const express_1 = __importDefault(require("express"));
const authorization_1 = require("../middlewares/authorization");
const router = express_1.default.Router();
router.post("/create", authorization_1.authorize, authorization_1.isAdmin, supportControllers_1.default.create);
router.get("/", supportControllers_1.default.getAll);
router.get("/:id", supportControllers_1.default.get);
exports.default = router;
