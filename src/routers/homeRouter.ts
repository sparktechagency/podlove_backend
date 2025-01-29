import HomeServices from "@services/homeServices";
import express from "express";
import { authorize } from "@middlewares/authorization";

const router = express.Router();

router.get("/", authorize, HomeServices.homeData);

export default router;
