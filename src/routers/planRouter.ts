import express from "express";
// import PlanController from "@controllers/planControllers";
import { admin_authorize, authorize } from "@middlewares/authorization";
import planController from "@controllers/planControllers";

const router = express.Router();

router.post("/create", planController.create);
router.get("/", admin_authorize, planController.getAll);
router.get("/:id", planController.get);
router.put("/update/:id", planController.update);

export default router;
