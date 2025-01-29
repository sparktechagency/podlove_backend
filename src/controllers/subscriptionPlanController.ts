import Stripe from "stripe";
import "dotenv/config";
import to from "await-to-ts";
import createError from "http-errors";
import { NextFunction, Request, Response } from "express";
import SubscriptionPlan from "@models/subscriptionPlanModel";
import { StatusCodes } from "http-status-codes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, description, unitAmount, interval } = req.body;
  let error, product, price, subscriptionPlan;

  [error, product] = await to(
    stripe.products.create({
      name: name!,
      description: description
    })
  );
  if (error) return next(error);

  [error, price] = await to(
    stripe.prices.create({
      product: product.id,
      unit_amount: Number.parseFloat(unitAmount) * 100,
      currency: "usd",
      recurring: {
        interval: interval!
      }
    })
  );
  if (error) return next(error);

  [error, subscriptionPlan] = await to(
    SubscriptionPlan.create({
      name: name,
      description: description,
      unitAmount: Number.parseFloat(unitAmount),
      interval: interval,
      productId: product.id,
      priceId: price.id
    })
  );
  if (error) return next(error);

  return res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Success",
    data: subscriptionPlan
  });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const [error, subscriptionPlan] = await to(SubscriptionPlan.findById(id).lean());
  if (error) return next(error);
  if (!subscriptionPlan) return next(createError(StatusCodes.NOT_FOUND, "Subscription Plan not found!"));
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: subscriptionPlan });
};

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const [error, subscriptionPlans] = await to(SubscriptionPlan.find().lean());
  if (error) return next(error);
  if (!subscriptionPlans || subscriptionPlans.length === 0) {
    return res.status(StatusCodes.OK).json({ success: true, message: "No Subscription Plans Found!", data: [] });
  }
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: subscriptionPlans });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  let { name, description, unitAmount, interval } = req.body;

  let error, price, subscriptionPlan;
  [error, subscriptionPlan] = await to(SubscriptionPlan.findById(id));
  if (error) return next(error);
  if (!subscriptionPlan) return next(createError(StatusCodes.NOT_FOUND, "Subscription Plan not found!"));

  if (name || description) {
    subscriptionPlan.name = name || subscriptionPlan.name;
    subscriptionPlan.description = description || subscriptionPlan.description;

    const [error] = await to(stripe.products.update(subscriptionPlan.productId, {
      name: name,
      description: description
    }));
    if (error) return next(error);
  }

  if (unitAmount || interval) {
    let [error] = await to(
      stripe.prices.update(subscriptionPlan.priceId, {
        active: false
      })
    );
    if (error) return next(error);

    subscriptionPlan.unitAmount = unitAmount || subscriptionPlan.unitAmount;
    subscriptionPlan.interval = interval || subscriptionPlan.interval;

    [error, price] = await to(
      stripe.prices.create({
        product: subscriptionPlan.productId,
        unit_amount: Number.parseFloat(subscriptionPlan.unitAmount) * 100,
        currency: "usd",
        recurring: {
          interval: subscriptionPlan.interval!
        }
      })
    );
    if (error) return next(error);
    if (price) subscriptionPlan.priceId = price.id;
  }

  [error] = await to(subscriptionPlan.save());
  if (error) return next(error);

  res.status(StatusCodes.OK).json({
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

export default SubscriptionPlanController;
