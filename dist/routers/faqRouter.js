"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const faqControllers_1 = __importDefault(require("../controllers/faqControllers"));
const express_1 = __importDefault(require("express"));
const authorization_1 = require("../middlewares/authorization");
const router = express_1.default.Router();
router.post("/create", authorization_1.authorize, authorization_1.isAdmin, faqControllers_1.default.create);
router.get("/", faqControllers_1.default.get);
router.put("/update/:id", authorization_1.authorize, authorization_1.isAdmin, faqControllers_1.default.update);
router.delete("/delete/:id", authorization_1.authorize, authorization_1.isAdmin, faqControllers_1.default.remove);
exports.default = router;
