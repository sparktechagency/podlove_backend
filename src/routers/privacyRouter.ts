import express from "express";
import PrivacyController from "@controllers/privacyControllers";
import { authorize, isAdmin } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", authorize, isAdmin, PrivacyController.create);
router.get("/", authorize, PrivacyController.get);
router.put("/update/:id", authorize, isAdmin, PrivacyController.update);

export default router;
