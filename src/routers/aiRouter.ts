import express from "express";
import OpenaiServices from "@services/openaiServices";
const router = express.Router();

router.post("/is-user-suitable", OpenaiServices.isUserSuitable);

export default router;