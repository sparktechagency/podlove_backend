import express, { Request, Response, NextFunction } from "express";
import { notFound } from "@middlewares/notfound";
import { errorHandler } from "@middlewares/errorHandler";
import cors from "cors";
import AuthRouter from "@routers/authRouter";
import UserRouter from "@routers/userRouter";
import FaqRouter from "@routers/faqRouter";
import TaCRouter from "@routers/tacRouter";
import PrivacyRouter from "@routers/privacyRouter";
import PlanRouter from "@routers/planRouter";
import AnalyticsRouter from "@routers/analyticsRouter";
import SupportRouter from "@routers/supportRouter";
import WebhookRouter from "@routers/webhookRouter";
import SubscriptionRouter from "@routers/subscriptionRouter";
import AdminRouter from "@routers/adminRouter";
import SurveyRouter from "@routers/surveyRouter";
import PodcastRouter from "@routers/podcastRouter";

const app = express();

app.use("/", WebhookRouter);

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

app.use("/auth", AuthRouter);
app.use("/user", UserRouter);
app.use("/tac", TaCRouter);
app.use("/faq", FaqRouter);
app.use("/privacy", PrivacyRouter);
app.use("/plan", PlanRouter);
app.use("/analytics", AnalyticsRouter);
app.use("/support", SupportRouter);
app.use("/subscription", SubscriptionRouter);
app.use("/admin", AdminRouter);
app.use("/survey", SurveyRouter);
app.use("/podcast", PodcastRouter);

app.use("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello From Podlove");
});

app.use(notFound);
app.use(errorHandler);

export default app;
