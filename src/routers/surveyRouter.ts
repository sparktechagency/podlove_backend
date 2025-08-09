import SupportController from "@controllers/supportControllers";
import express from "express";
import { authorize } from "@middlewares/authorization";
import SurveyController from "@controllers/surveyController";

const router = express.Router();

router.post("/create", authorize, SurveyController.create);
router.get("/:id", SurveyController.get);


export default router;
