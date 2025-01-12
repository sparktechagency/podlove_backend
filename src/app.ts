import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import AuthRouter from "@routers/authRouter";
// import UserRouter from "@routers/userRouter";
import { errorHandler } from "@middlewares/errorHandler";
// import accountRouter from "@routers/stripeAccount";
import { notFound } from "@middlewares/notfound";
// import FaqRouter from "@routers/faqRouter";
// import TaCRouter from "@routers/tacRouter";
// import PrivacyRouter from "@routers/privacyRouter";
// import AboutRouter from "@routers/aboutRouter";
// import WebhookRouter from "@routers/webhookRouter";

const app = express();

// app.use("/", WebhookRouter);

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// app.use("/user", UserRouter);
app.use("/auth", AuthRouter);
// app.use("/account", accountRouter);

// app.use("/tac", TaCRouter);
// app.use("/faq", FaqRouter);
// app.use("/privacy", PrivacyRouter);
// app.use("/about", AboutRouter);

app.use("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("Hello From Tha Drop Backend");
});

app.use(notFound);
app.use(errorHandler);

export default app;
