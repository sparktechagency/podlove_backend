"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
require("dotenv/config");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const subscriptionPlanModel_1 = __importDefault(require("../models/subscriptionPlanModel"));
const http_status_codes_1 = require("http-status-codes");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const create = async (req, res, next) => {
    const { name, description, unitAmount, interval } = req.body;
    let error, product, price, subscriptionPlan;
    [error, product] = await (0, await_to_ts_1.default)(stripe.products.create({
        name: name,
        description: description
    }));
    if (error)
        return next(error);
    [error, price] = await (0, await_to_ts_1.default)(stripe.prices.create({
        product: product.id,
        unit_amount: Number.parseFloat(unitAmount) * 100,
        currency: "usd",
        recurring: {
            interval: interval
        }
    }));
    if (error)
        return next(error);
    [error, subscriptionPlan] = await (0, await_to_ts_1.default)(subscriptionPlanModel_1.default.create({
        name: name,
        description: description,
        unitAmount: Number.parseFloat(unitAmount),
        interval: interval,
        productId: product.id,
        priceId: price.id
    }));
    if (error)
        return next(error);
    return res.status(http_status_codes_1.StatusCodes.CREATED).json({
        success: true,
        message: "Success",
        data: subscriptionPlan
    });
};
const get = async (req, res, next) => {
    const id = req.params.id;
    const [error, subscriptionPlan] = await (0, await_to_ts_1.default)(subscriptionPlanModel_1.default.findById(id).lean());
    if (error)
        return next(error);
    if (!subscriptionPlan)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Subscription Plan not found!"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: subscriptionPlan });
};
const getAll = async (req, res, next) => {
    const [error, subscriptionPlans] = await (0, await_to_ts_1.default)(subscriptionPlanModel_1.default.find().lean());
    if (error)
        return next(error);
    if (!subscriptionPlans || subscriptionPlans.length === 0) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "No Subscription Plans Found!", data: [] });
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: subscriptionPlans });
};
const update = async (req, res, next) => {
    const id = req.params.id;
    let { name, description, unitAmount, interval } = req.body;
    let error, price, subscriptionPlan;
    [error, subscriptionPlan] = await (0, await_to_ts_1.default)(subscriptionPlanModel_1.default.findById(id));
    if (error)
        return next(error);
    if (!subscriptionPlan)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Subscription Plan not found!"));
    if (name || description) {
        subscriptionPlan.name = name || subscriptionPlan.name;
        subscriptionPlan.description = description || subscriptionPlan.description;
        const [error] = await (0, await_to_ts_1.default)(stripe.products.update(subscriptionPlan.productId, {
            name: name,
            description: description
        }));
        if (error)
            return next(error);
    }
    if (unitAmount || interval) {
        let [error] = await (0, await_to_ts_1.default)(stripe.prices.update(subscriptionPlan.priceId, {
            active: false
        }));
        if (error)
            return next(error);
        subscriptionPlan.unitAmount = unitAmount || subscriptionPlan.unitAmount;
        subscriptionPlan.interval = interval || subscriptionPlan.interval;
        [error, price] = await (0, await_to_ts_1.default)(stripe.prices.create({
            product: subscriptionPlan.productId,
            unit_amount: Number.parseFloat(subscriptionPlan.unitAmount) * 100,
            currency: "usd",
            recurring: {
                interval: subscriptionPlan.interval
            }
        }));
        if (error)
            return next(error);
        if (price)
            subscriptionPlan.priceId = price.id;
    }
    [error] = await (0, await_to_ts_1.default)(subscriptionPlan.save());
    if (error)
        return next(error);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Success",
        data: subscriptionPlan
    });
};
const SubscriptionPlanController = {
    create,
    get,
    getAll,
    update
};
exports.default = SubscriptionPlanController;
