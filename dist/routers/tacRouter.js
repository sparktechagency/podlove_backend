"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tacControllers_1 = __importDefault(require("../controllers/tacControllers"));
const authorization_1 = require("../middlewares/authorization");
const router = express_1.default.Router();
router.post("/create", authorization_1.authorize, authorization_1.isAdmin, tacControllers_1.default.create);
router.get("/", authorization_1.authorize, tacControllers_1.default.get);
router.put("/update/:id", authorization_1.authorize, authorization_1.isAdmin, tacControllers_1.default.update);
exports.default = router;
