"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const http_errors_1 = __importDefault(require("http-errors"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const enums_1 = require("@shared/enums");
const http_status_codes_1 = require("http-status-codes");
const userModel_1 = __importDefault(require("@models/userModel"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const webhook = async (req, res, next) => {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event = req.body;
    if (endpointSecret) {
        const signature = req.headers["stripe-signature"];
        if (!signature)
            next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.FORBIDDEN, "Unauthorized"));
        try {
            event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        }
        catch (error) {
            console.log(`Webhook signature verification failed:`, error.message);
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ error: error.message });
        }
    }
    let error, subscriptionId, user, invoice;
    switch (event.type) {
        case "invoice.payment_succeeded":
            invoice = event.data.object;
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const plan = subscription.metadata.plan;
            const fee = subscription.metadata.fee;
            const userId = subscription.metadata.userId;
            [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
            if (error)
                throw error;
            if (!user)
                throw new Error("User not found");
            user.subscription.id = subscription.id;
            user.subscription.plan = plan;
            user.subscription.fee = fee;
            user.subscription.startedAt = new Date();
            user.subscription.status = enums_1.SubscriptionStatus.PAID;
            [error] = await (0, await_to_ts_1.default)(user.save());
            if (error)
                throw error;
            break;
        // case "invoice_payment_failed":
        //   invoice = event.data.object as Stripe.Invoice;
        //   const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        //   const plan = subscription.metadata.plan;
        //   const fee = Number.parseFloat(subscription.metadata.fee);
        //   const userId = subscription.metadata.userId;
        //   [error, user] = await to(User.findById(userId));
        //   if (error) throw error;
        //   if(!user) throw new Error("User not found");
        //   user.subscription!.plan = plan;
        //   user.subscription!.fee = fee;
        //   user.subscription!.startedAt = new Date();
        //   user.subscription!.status = SubscriptionStatus.PAID;
        //   [error] = await to(user.save());
        //   if(error) throw error;
        //   break;
    }
};
const StripeServices = {
    webhook,
};
exports.default = StripeServices;
