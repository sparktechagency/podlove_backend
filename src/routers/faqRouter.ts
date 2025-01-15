import FaqController from "@controllers/faqControllers";
import express from "express";
import { authorize, isAdmin } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", authorize, isAdmin, FaqController.create);
router.get("/", FaqController.get);
router.put("/update/:id", authorize, isAdmin, FaqController.update);
router.delete("/delete/:id", authorize, isAdmin, FaqController.remove);

export default router;
