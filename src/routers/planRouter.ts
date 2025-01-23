import express from "express";
import PlanController from "@controllers/planControllers";
import { authorize, isAdmin } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", PlanController.create);
router.get("/", authorize, PlanController.getAll);
router.get("/:id", authorize, PlanController.get);
router.put("/update/:id", authorize, isAdmin, PlanController.update);

export default router;
