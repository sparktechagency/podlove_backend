import FaqController from "@controllers/faqControllers";
import express from "express";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", FaqController.create);
router.get("/", FaqController.get);
router.put("/update/:id", FaqController.update);
router.delete("/delete/:id", FaqController.remove);

export default router;
