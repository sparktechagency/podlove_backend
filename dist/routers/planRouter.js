"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const planControllers_1 = __importDefault(require("../controllers/planControllers"));
const authorization_1 = require("../middlewares/authorization");
const router = express_1.default.Router();
router.post("/create", planControllers_1.default.create);
router.get("/", authorization_1.authorize, planControllers_1.default.getAll);
router.get("/:id", authorization_1.authorize, planControllers_1.default.get);
router.put("/update/:id", authorization_1.authorize, authorization_1.isAdmin, planControllers_1.default.update);
exports.default = router;
