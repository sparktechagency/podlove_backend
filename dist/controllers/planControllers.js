"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stripe_1 = __importDefault(require("stripe"));
require("dotenv/config");
const await_to_ts_1 = __importDefault(require("await-to-ts"));
const http_errors_1 = __importDefault(require("http-errors"));
const planModel_1 = __importDefault(require("@models/planModel"));
const http_status_codes_1 = require("http-status-codes");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
const create = async (req, res, next) => {
    const { name, description, unitAmount, interval } = req.body;
    let error, product, price, plan;
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
    [error, plan] = await (0, await_to_ts_1.default)(planModel_1.default.create({
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
        data: plan
    });
};
const get = async (req, res, next) => {
    const id = req.params.id;
    const [error, plan] = await (0, await_to_ts_1.default)(planModel_1.default.findById(id).lean());
    if (error)
        return next(error);
    if (!plan)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Plan not found!"));
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: plan });
};
const getAll = async (req, res, next) => {
    const [error, plans] = await (0, await_to_ts_1.default)(planModel_1.default.find().lean());
    if (error)
        return next(error);
    if (!plans || plans.length === 0) {
        return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "No Plans Found!", data: [] });
    }
    return res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, message: "Success", data: plans });
};
const update = async (req, res, next) => {
    const id = req.params.id;
    let { name, description, unitAmount, interval } = req.body;
    let error, price, plan;
    [error, plan] = await (0, await_to_ts_1.default)(planModel_1.default.findById(id));
    if (error)
        next(error);
    if (!plan)
        return next((0, http_errors_1.default)(http_status_codes_1.StatusCodes.NOT_FOUND, "Plan not found!"));
    if (name || description) {
        plan.name = name || plan.name;
        plan.description = description || plan.description;
        const [error] = await (0, await_to_ts_1.default)(stripe.products.update(plan.productId, { name: name, description: description }));
        if (error)
            return next(error);
    }
    if (unitAmount || interval) {
        let [error] = await (0, await_to_ts_1.default)(stripe.prices.update(plan.priceId, {
            active: false
        }));
        if (error)
            return next(error);
        plan.unitAmount = Number.parseInt(unitAmount) || plan.unitAmount;
        plan.interval = interval || plan.interval;
        [error, price] = await (0, await_to_ts_1.default)(stripe.prices.create({
            product: plan.productId,
            unit_amount: plan.unitAmount * 100,
            currency: "usd",
            recurring: {
                interval: plan.interval
            }
        }));
        if (error)
            return next(error);
        if (price)
            plan.priceId = price.id;
    }
    [error] = await (0, await_to_ts_1.default)(plan.save());
    if (error)
        return next(error);
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Success",
        data: plan
    });
};
const controller = {
    create,
    get,
    getAll,
    update
};
exports.default = controller;
