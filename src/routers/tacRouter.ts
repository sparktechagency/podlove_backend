import express from "express";
import TaCController from "@controllers/tacControllers";
import { authorize, isAdmin } from "@middlewares/authorization";
const router = express.Router();

router.post("/create", authorize, isAdmin, TaCController.create);
router.get("/", authorize, TaCController.get);
router.put("/update/:id", authorize, isAdmin, TaCController.update);

export default router;
