import SupportController from "@controllers/supportControllers";
import express from "express";
import { authorize } from "@middlewares/authorization";
import SupportServices from "@services/supportServices";

const router = express.Router();

router.post("/create", SupportController.create);
router.get("/", SupportController.getAll);
router.get("/:id", SupportController.get);
router.post("/reply/:id", SupportServices.reply);


export default router;
