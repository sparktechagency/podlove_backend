"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const userModel_1 = __importDefault(require("../models/userModel"));
const http_errors_1 = __importDefault(require("http-errors"));
const http_status_codes_1 = require("http-status-codes");
const planModel_1 = __importDefault(require("../models/planModel"));
const enums_1 = require("../shared/enums");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const upgrade = async (req, res, next) => {
    const userId = req.user.userId;
    const planId = req.body.planId;
    let error, user, plan, session, customer;
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    [error, plan] = await (0, await_to_ts_1.default)(planModel_1.default.findById(planId));
    if (error)
        return next(error);
    if (!plan)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Plan not found"));
    [error, customer] = await (0, await_to_ts_1.default)(stripe.customers.create({ email: req.user.email }));
    if (error)
        return next(error);
    [error, session] = await (0, await_to_ts_1.default)(stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer: customer.id,
        mode: "subscription",
        line_items: [
            {
                price: plan.priceId,
                quantity: 1
            }
        ],
        subscription_data: {
            metadata: {
                plan: plan.name,
                fee: plan.unitAmount,
                userId: userId
            }
        },
        success_url: `https://example.com/success`,
        cancel_url: `https://example.com/cancel`
    }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: session });
};
const cancel = async (req, res, next) => {
    const userId = req.user.userId;
    let error, user;
    [error, user] = await (0, await_to_ts_1.default)(userModel_1.default.findById(userId));
    if (error)
        return next(error);
    if (!user)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found"));
    [error] = await (0, await_to_ts_1.default)(stripe.subscriptions.update(user.subscription.id, {
        cancel_at_period_end: true
    }));
    if (error)
        return next(error);
    user.subscription.id = "";
    user.subscription.plan = enums_1.SubscriptionPlan.LISTENER;
    user.subscription.fee = 0;
    user.subscription.status = enums_1.SubscriptionStatus.NONE;
    user.subscription.startedAt = new Date();
    [error] = await (0, await_to_ts_1.default)(user.save());
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: {} });
};
const SubscriptionServices = {
    upgrade,
    cancel
};
exports.default = SubscriptionServices;
