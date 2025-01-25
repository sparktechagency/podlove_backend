import SupportController from "@controllers/supportControllers";
import express from "express";
import { authorize, isAdmin } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", authorize, isAdmin, SupportController.create);
router.get("/", SupportController.getAll);
router.get("/:id", SupportController.get);

export default router;
