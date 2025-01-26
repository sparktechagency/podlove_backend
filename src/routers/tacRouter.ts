import express from "express";
import TaCController from "@controllers/tacControllers";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.post("/create", TaCController.create);
router.get("/", TaCController.get);
router.put("/update", TaCController.update);

export default router;
