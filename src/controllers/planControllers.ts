import Stripe from "stripe";
import "dotenv/config";
import to from "await-to-ts";
import createError from "http-errors";
import { NextFunction, Request, Response } from "express";
import Plan from "@models/planModel";
import { StatusCodes } from "http-status-codes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { name, description, unitAmount, interval } = req.body;

  let error, product, price, plan;

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

  [error, plan] = await to(
    Plan.create({
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
    data: plan
  });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const [error, plan] = await to(Plan.findById(id).lean());
  if (error) return next(error);
  if (!plan) return next(createError(StatusCodes.NOT_FOUND, "Plan not found!"));
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: plan });
};

const getAll = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const [error, plans] = await to(Plan.find().lean());
  if (error) return next(error);
  if (!plans || plans.length === 0) {
    return res.status(StatusCodes.OK).json({ success: true, message: "No Plans Found!", data: [] });
  }
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: plans });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  let { name, description, unitAmount, interval } = req.body;

  let error, price, plan;
  [error, plan] = await to(Plan.findById(id));
  if (error) next(error);
  if (!plan) return next(createError(StatusCodes.NOT_FOUND, "Plan not found!"));

  if (name || description) {
    plan.name = name || plan.name;
    plan.description = description || plan.description;

    const [error] = await to(stripe.products.update(plan.productId, { name: name, description: description }));
    if (error) return next(error);
  }

  if (unitAmount || interval) {
    let [error] = await to(
      stripe.prices.update(plan.priceId, {
        active: false
      })
    );
    if (error) return next(error);

    plan.unitAmount = Number.parseInt(unitAmount) || plan.unitAmount;
    plan.interval = interval || plan.interval;

    [error, price] = await to(
      stripe.prices.create({
        product: plan.productId,
        unit_amount: plan.unitAmount * 100,
        currency: "usd",
        recurring: {
          interval: plan.interval!
        }
      })
    );
    if (error) return next(error);
    if (price) plan.priceId = price.id;
  }

  [error] = await to(plan.save());
  if (error) return next(error);

  res.status(StatusCodes.OK).json({
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

export default controller;
