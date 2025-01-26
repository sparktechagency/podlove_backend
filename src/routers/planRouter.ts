import express from "express";
import PlanController from "@controllers/planControllers";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", PlanController.create);
router.get("/", PlanController.getAll);
router.get("/:id", PlanController.get);
router.put("/update/:id", PlanController.update);

export default router;
