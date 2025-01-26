import AdminServices from "@services/adminServices";
import express from "express";
import { authorize, isAdmin } from "@middlewares/authorization";

const router = express.Router();

router.post("/send-message", AdminServices.sendMessage);

export default router;
