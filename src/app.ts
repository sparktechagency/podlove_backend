import express, { Request, Response, NextFunction } from "express";
import { notFound } from "@middlewares/notfound";
import { errorHandler } from "@middlewares/errorHandler";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import AuthRouter from "@routers/authRouter";
import UserRouter from "@routers/userRouter";
import FaqRouter from "@routers/faqRouter";
import TaCRouter from "@routers/tacRouter";
import PrivacyRouter from "@routers/privacyRouter";
import AnalyticsRouter from "@routers/analyticsRouter";
import SupportRouter from "@routers/supportRouter";
import WebhookRouter from "@routers/webhookRouter";
import SubscriptionRouter from "@routers/subscriptionRouter";
import AdminRouter from "@routers/adminRouter";
import SurveyRouter from "@routers/surveyRouter";
import PodcastRouter from "@routers/podcastRouter";
import HomeRouter from "@routers/homeRouter";
import AIRouter from "@routers/aiRouter";
// import ChatRouter from "@routers/chatRouter";
import NotificationRouter from "@routers/notificationRouter";
import ConsumerPolicyRouter from "@routers/consumerPolicyRouter";
import MediaPolicyRouter from "@routers/mediaPolicyRouter";
import path from "path";
import ChatRouter from "@routers/chatRouter";
import SubscriptionPlanRouter from "@routers/subscriptionPlanRouter"

const app = express();
// app.use(apiLogger);
app.use("/", WebhookRouter);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);

app.use("/auth", AuthRouter);
app.use("/user", UserRouter);
app.use("/tac", TaCRouter);
app.use("/faq", FaqRouter);
app.use("/privacy", PrivacyRouter);
// app.use("/plan", SubscriptionPlanRouter);
app.use("/subscription-plan", SubscriptionPlanRouter);
app.use("/analytics", AnalyticsRouter);
app.use("/support", SupportRouter);
app.use("/subscription", SubscriptionRouter);
app.use("/admin", AdminRouter);
app.use("/survey", SurveyRouter);
app.use("/podcast", PodcastRouter);
app.use("/home", HomeRouter);
app.use("/ai", AIRouter);
app.use("/notification", NotificationRouter);
app.use("/consumer", ConsumerPolicyRouter);
app.use("/media", MediaPolicyRouter);
app.use("/chat", ChatRouter);

app.use("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello From Podlove");
});

app.use(notFound);
app.use(errorHandler);

export default app;
